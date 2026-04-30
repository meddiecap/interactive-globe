<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
    // { key, label, format, points: [{year, value}], empty }
    chart: { type: Object, required: true },
})

const SPARK_W = 280
const SPARK_H = 64
const SPARK_PAD = 4

// ---------------------------------------------------------------------------
// Geometry builders
// ---------------------------------------------------------------------------

const spark = computed(() => {
    if (props.chart.key === 'gdpGrowth') return null
    return buildSparkPath(props.chart.points)
})

const bars = computed(() => {
    if (props.chart.key !== 'gdpGrowth') return null
    return buildGrowthBars(props.chart.points)
})

function buildSparkPath(points) {
    if (!points?.length) return null

    const values = points.map(p => p.value)
    const years = points.map(p => p.year)
    const minV = Math.min(...values)
    const maxV = Math.max(...values)
    const minY = Math.min(...years)
    const maxY = Math.max(...years)
    const rangeV = maxV - minV || 1
    const rangeY = maxY - minY || 1

    const toX = y => SPARK_PAD + ((y - minY) / rangeY) * (SPARK_W - SPARK_PAD * 2)
    const toY = v => SPARK_H - SPARK_PAD - ((v - minV) / rangeV) * (SPARK_H - SPARK_PAD * 2)

    const d = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.year).toFixed(1)},${toY(p.value).toFixed(1)}`)
        .join(' ')

    const firstX = toX(years[0]).toFixed(1)
    const lastX = toX(years[years.length - 1]).toFixed(1)
    const bottom = (SPARK_H - SPARK_PAD).toFixed(1)
    const fill = `${d} L${lastX},${bottom} L${firstX},${bottom} Z`

    return { d, fill, minV, maxV, minY, maxY, toX, toY }
}

function buildGrowthBars(points) {
    if (!points?.length) return null

    const values = points.map(p => p.value)
    const years = points.map(p => p.year)
    const absMax = Math.max(...values.map(Math.abs), 1)
    const minY = Math.min(...years)
    const maxY = Math.max(...years)
    const rangeY = maxY - minY || 1

    const barW = Math.max(2, (SPARK_W - SPARK_PAD * 2) / points.length - 1)
    const midY = SPARK_H / 2
    const scaleH = (SPARK_H / 2 - SPARK_PAD) / absMax

    return points.map(p => {
        const x = SPARK_PAD + ((p.year - minY) / rangeY) * (SPARK_W - SPARK_PAD * 2)
        const h = Math.abs(p.value) * scaleH
        const y = p.value >= 0 ? midY - h : midY
        return { x: x - barW / 2, y, w: barW, h, positive: p.value >= 0, year: p.year, value: p.value }
    })
}

// ---------------------------------------------------------------------------
// Tooltip (local to this card)
// ---------------------------------------------------------------------------

const tooltip = ref(null) // { year, formatted, x, y }

function clearTooltip() {
    tooltip.value = null
}

function onSparkMove(event) {
    const s = spark.value
    if (!s) return
    const rect = event.currentTarget.getBoundingClientRect()
    const scaleX = SPARK_W / rect.width
    const mouseX = (event.clientX - rect.left) * scaleX

    let nearest = props.chart.points[0]
    let minDist = Infinity
    for (const p of props.chart.points) {
        const dist = Math.abs(s.toX(p.year) - mouseX)
        if (dist < minDist) { minDist = dist; nearest = p }
    }

    tooltip.value = {
        year: nearest.year,
        x: s.toX(nearest.year),
        y: s.toY(nearest.value),
        formatted: props.chart.format(nearest.value),
    }
}

function onBarEnter(bar) {
    tooltip.value = {
        year: bar.year,
        x: bar.x + bar.w / 2,
        y: bar.positive ? bar.y : SPARK_H / 2,
        formatted: props.chart.format(bar.value),
    }
}

function tooltipBox(x, label) {
    const w = Math.max(64, label.length * 5.8 + 12)
    const cx = Math.min(Math.max(x, w / 2 + SPARK_PAD), SPARK_W - w / 2 - SPARK_PAD)
    return { rx: cx - w / 2, ry: 1, rw: w, tx: cx, ty: 12 }
}

const lastPoint = computed(() => {
    const pts = props.chart.points
    return pts?.[pts.length - 1] ?? null
})
</script>

<template>
    <div class="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
        <p class="text-gray-400 text-xs uppercase tracking-widest mb-3">{{ chart.label }}</p>

        <!-- No data -->
        <div v-if="chart.empty || (!spark && !bars)"
            class="flex items-center justify-center h-16 text-gray-600 text-xs">
            No data available
        </div>

        <!-- Line sparkline -->
        <template v-else-if="spark">
            <svg :width="SPARK_W" :height="SPARK_H" viewBox="0 0 280 64"
                class="w-full h-auto overflow-visible cursor-crosshair" @mousemove="onSparkMove"
                @mouseleave="clearTooltip">
                <path :d="spark.fill" fill="rgba(96,165,250,0.12)" />
                <path :d="spark.d" fill="none" stroke="#60a5fa" stroke-width="1.5" stroke-linejoin="round"
                    stroke-linecap="round" />
                <!-- Invisible overlay ensures mousemove fires over empty areas -->
                <rect x="0" y="0" :width="SPARK_W" :height="SPARK_H" fill="transparent" />
                <g v-if="tooltip">
                    <line :x1="tooltip.x" :y1="SPARK_PAD" :x2="tooltip.x" :y2="SPARK_H - SPARK_PAD" stroke="#94a3b8"
                        stroke-width="0.75" stroke-dasharray="2,2" />
                    <circle :cx="tooltip.x" :cy="tooltip.y" r="3" fill="#60a5fa" stroke="#1e293b" stroke-width="1.5" />
                    <rect :x="tooltipBox(tooltip.x, tooltip.year + ': ' + tooltip.formatted).rx"
                        :y="tooltipBox(tooltip.x, tooltip.year + ': ' + tooltip.formatted).ry"
                        :width="tooltipBox(tooltip.x, tooltip.year + ': ' + tooltip.formatted).rw" height="16"
                        fill="#1e293b" rx="3" opacity="0.95" />
                    <text :x="tooltipBox(tooltip.x, tooltip.year + ': ' + tooltip.formatted).tx"
                        :y="tooltipBox(tooltip.x, tooltip.year + ': ' + tooltip.formatted).ty" fill="#e2e8f0"
                        font-size="9" text-anchor="middle" font-family="ui-monospace, monospace">
                        {{ tooltip.year }}: {{ tooltip.formatted }}
                    </text>
                </g>
            </svg>
            <div class="flex justify-between text-gray-600 text-xs mt-1">
                <span>{{ spark.minY }}</span>
                <span class="text-gray-300 font-medium">
                    {{ chart.format(spark.maxV) }}<span class="text-gray-600 font-normal"> peak</span>
                </span>
                <span>{{ spark.maxY }}</span>
            </div>
        </template>

        <!-- Growth bar chart -->
        <template v-else-if="bars">
            <svg :width="SPARK_W" :height="SPARK_H" viewBox="0 0 280 64"
                class="w-full h-auto overflow-visible cursor-crosshair" @mouseleave="clearTooltip">
                <line :x1="SPARK_PAD" :y1="SPARK_H / 2" :x2="SPARK_W - SPARK_PAD" :y2="SPARK_H / 2" stroke="#374151"
                    stroke-width="0.5" />
                <rect v-for="bar in bars" :key="bar.year" :x="bar.x" :y="bar.y" :width="bar.w" :height="bar.h"
                    :fill="bar.positive ? '#4ade80' : '#f87171'" :fill-opacity="tooltip?.year === bar.year ? 1 : 0.7"
                    rx="1" @mouseenter="onBarEnter(bar)" />
                <g v-if="tooltip">
                    <rect :x="tooltipBox(tooltip.x, tooltip.year + ': ' + tooltip.formatted).rx"
                        :y="tooltipBox(tooltip.x, tooltip.year + ': ' + tooltip.formatted).ry"
                        :width="tooltipBox(tooltip.x, tooltip.year + ': ' + tooltip.formatted).rw" height="16"
                        fill="#1e293b" rx="3" opacity="0.95" />
                    <text :x="tooltipBox(tooltip.x, tooltip.year + ': ' + tooltip.formatted).tx"
                        :y="tooltipBox(tooltip.x, tooltip.year + ': ' + tooltip.formatted).ty" fill="#e2e8f0"
                        font-size="9" text-anchor="middle" font-family="ui-monospace, monospace">
                        {{ tooltip.year }}: {{ tooltip.formatted }}
                    </text>
                </g>
            </svg>
            <div class="flex justify-between text-gray-600 text-xs mt-1">
                <span>{{Math.min(...chart.points.map(p => p.year))}}</span>
                <span class="text-gray-500">
                    positive <span class="text-green-400">▌</span>&nbsp;
                    negative <span class="text-red-400">▌</span>
                </span>
                <span>{{Math.max(...chart.points.map(p => p.year))}}</span>
            </div>
        </template>

        <!-- Latest value -->
        <div class="mt-2 text-right">
            <span class="text-cyan-300 font-mono text-sm font-semibold">
                {{ chart.format(lastPoint?.value) }}
            </span>
            <span class="text-gray-600 text-xs ml-1">({{ lastPoint?.year }})</span>
        </div>
    </div>
</template>
