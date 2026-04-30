<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
    label: { type: String, required: true },
    format: { type: Function, required: true },
    seriesKey: { type: String, required: true },
    // [{ code, name, color, points: [{year, value}] }]
    series: { type: Array, required: true },
})

const SPARK_W = 280
const SPARK_H = 72
const SPARK_PAD = 6

// ── Year range (unified across all series) ──────────────────────────────────
const yearRange = computed(() => {
    const years = props.series.flatMap(s => s.points.map(p => p.year))
    if (!years.length) return { min: 2000, max: 2024 }
    return { min: Math.min(...years), max: Math.max(...years) }
})

function toX(year) {
    const { min, max } = yearRange.value
    const range = max - min || 1
    return SPARK_PAD + ((year - min) / range) * (SPARK_W - SPARK_PAD * 2)
}

// ── Value scale ──────────────────────────────────────────────────────────────
// gdpGrowth uses a shared scale (same unit → comparable across countries).
// All other indicators are normalised per-series so differences in magnitude
// don't flatten one country's line to nothing (e.g. China GDP vs Iceland GDP).
const isSharedScale = computed(() => props.seriesKey === 'gdpGrowth')

const sharedValueRange = computed(() => {
    const values = props.series.flatMap(s => s.points.map(p => p.value))
    if (!values.length) return { min: -5, max: 5 }
    return { min: Math.min(...values), max: Math.max(...values) }
})

function buildToY(minV, maxV) {
    const range = maxV - minV || 1
    return v => SPARK_H - SPARK_PAD - ((v - minV) / range) * (SPARK_H - SPARK_PAD * 2)
}

function buildSeriesPath(points, toY) {
    return points
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.year).toFixed(1)},${toY(p.value).toFixed(1)}`)
        .join(' ')
}

// paths: [{ code, name, color, d, toY, points }]
const paths = computed(() => {
    return props.series.map(s => {
        if (!s.points.length) return { code: s.code, name: s.name, color: s.color, d: null, toY: null, points: [] }
        const { min, max } = isSharedScale.value
            ? sharedValueRange.value
            : (() => { const vs = s.points.map(p => p.value); return { min: Math.min(...vs), max: Math.max(...vs) } })()
        const toY = buildToY(min, max)
        return { code: s.code, name: s.name, color: s.color, d: buildSeriesPath(s.points, toY), toY, points: s.points }
    })
})

// Zero line for gdpGrowth (only when scale includes negative values)
const zeroLineY = computed(() => {
    if (!isSharedScale.value) return null
    const { min, max } = sharedValueRange.value
    if (min >= 0) return null
    return buildToY(min, max)(0)
})

// ── Tooltip ──────────────────────────────────────────────────────────────────
const tooltip = ref(null)

function onMouseMove(event) {
    const activePaths = paths.value.filter(s => s.points.length && s.toY)
    if (!activePaths.length) return

    const rect = event.currentTarget.getBoundingClientRect()
    const scaleX = SPARK_W / rect.width
    const mouseX = (event.clientX - rect.left) * scaleX

    // Find the year closest to the cursor across all series
    let nearestYear = null
    let minDist = Infinity
    for (const s of props.series) {
        for (const p of s.points) {
            const dist = Math.abs(toX(p.year) - mouseX)
            if (dist < minDist) { minDist = dist; nearestYear = p.year }
        }
    }
    if (nearestYear == null) return

    const points = activePaths.map(s => {
        const pt = s.points.reduce((best, p) =>
            Math.abs(p.year - nearestYear) < Math.abs(best.year - nearestYear) ? p : best
        )
        return { code: s.code, name: s.name, color: s.color, value: pt.value, y: s.toY(pt.value) }
    })

    tooltip.value = { year: nearestYear, x: toX(nearestYear), points }
}

function clearTooltip() { tooltip.value = null }

// ── Legend rows: latest values by default, hovered year on hover ─────────────
const legendRows = computed(() => {
    const raw = tooltip.value
        ? tooltip.value.points.map(pt => ({
            code: pt.code, name: pt.name, color: pt.color,
            value: pt.value, year: tooltip.value.year,
        }))
        : props.series.map(s => {
            const pt = s.points[s.points.length - 1]
            return { code: s.code, name: s.name, color: s.color, value: pt?.value ?? null, year: pt?.year ?? null }
        })

    // Sort high → low; nulls sink to bottom
    const sorted = [...raw].sort((a, b) => {
        if (a.value == null && b.value == null) return 0
        if (a.value == null) return 1
        if (b.value == null) return -1
        return b.value - a.value
    })

    // Attach diff to the row above each neighbour (always positive)
    return sorted.map((row, i) => ({
        ...row,
        diff: i < sorted.length - 1 && row.value != null && sorted[i + 1].value != null
            ? row.value - sorted[i + 1].value
            : null,
    }))
})

const isEmpty = computed(() => props.series.every(s => !s.points.length))
</script>

<template>
    <div class="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
        <p class="text-gray-400 text-xs uppercase tracking-widest mb-3">{{ label }}</p>

        <div v-if="isEmpty" class="flex items-center justify-center h-16 text-gray-600 text-xs">
            No data available
        </div>

        <template v-else>
            <!-- SVG chart -->
            <svg :width="SPARK_W" :height="SPARK_H" viewBox="0 0 280 72"
                class="w-full h-auto overflow-visible cursor-crosshair" @mousemove="onMouseMove"
                @mouseleave="clearTooltip">

                <!-- Zero baseline for gdpGrowth -->
                <line v-if="zeroLineY != null" :x1="SPARK_PAD" :y1="zeroLineY" :x2="SPARK_W - SPARK_PAD" :y2="zeroLineY"
                    stroke="#374151" stroke-width="0.75" stroke-dasharray="3,2" />

                <!-- Series lines -->
                <template v-for="s in paths" :key="s.code">
                    <path v-if="s.d" :d="s.d" fill="none" :stroke="s.color" stroke-width="1.5" stroke-linejoin="round"
                        stroke-linecap="round" opacity="0.9" />
                </template>

                <!-- Tooltip: vertical rule + dots per series -->
                <g v-if="tooltip">
                    <line :x1="tooltip.x" :y1="SPARK_PAD" :x2="tooltip.x" :y2="SPARK_H - SPARK_PAD" stroke="#94a3b8"
                        stroke-width="0.75" stroke-dasharray="2,2" />
                    <circle v-for="pt in tooltip.points" :key="pt.code" :cx="tooltip.x" :cy="pt.y" r="3"
                        :fill="pt.color" stroke="#1e293b" stroke-width="1.5" />
                </g>
            </svg>

            <!-- Year range axis labels -->
            <div class="flex justify-between text-gray-600 text-xs mt-1.5">
                <span>{{ yearRange.min }}</span>
                <span v-if="isSharedScale" class="text-gray-600">shared scale</span>
                <span v-else class="text-gray-600">normalised</span>
                <span>{{ yearRange.max }}</span>
            </div>

            <!-- Legend: updates to hovered year on hover, latest values otherwise -->
            <div class="mt-2 space-y-1">
                <div v-for="s in legendRows" :key="s.code" class="flex items-center gap-1.5 text-xs min-w-0">
                    <span class="inline-block w-4 h-0.5 rounded-full shrink-0" :style="{ backgroundColor: s.color }" />
                    <span class="text-gray-500 truncate min-w-0 flex-1">{{ s.name }}</span>
                    <span v-if="s.diff != null" class="text-gray-600 shrink-0">↕{{ format(s.diff) }}</span>
                    <span class="font-mono shrink-0" :style="{ color: s.color }">{{ format(s.value) }}</span>
                    <span class="shrink-0" :class="tooltip ? 'text-white' : 'text-gray-600'">({{ s.year }})</span>
                </div>
            </div>
        </template>
    </div>
</template>
