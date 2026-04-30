<script setup>
import { watch, computed } from 'vue'
import { useWorldBankTimeseries } from '../composables/useWorldBankTimeseries.js'
import { useApi } from '../composables/useApi.js'

const props = defineProps({
    country: { type: Object, default: null },
    open: { type: Boolean, default: false },
})
defineEmits(['close'])

const { countryData } = useApi()
const { data, loading, error, fetchAll, SERIES } = useWorldBankTimeseries()

watch(
    () => props.open,
    (isOpen) => { if (isOpen && props.country) fetchAll(props.country.code) }
)

// ---------------------------------------------------------------------------
// SVG sparkline builder
// ---------------------------------------------------------------------------

const SPARK_W = 280
const SPARK_H = 64
const SPARK_PAD = 4

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

    // Fill area under line
    const firstX = toX(years[0]).toFixed(1)
    const lastX = toX(years[years.length - 1]).toFixed(1)
    const bottom = (SPARK_H - SPARK_PAD).toFixed(1)
    const fill = `${d} L${lastX},${bottom} L${firstX},${bottom} Z`

    return { d, fill, minV, maxV, minY, maxY, points, toX, toY }
}

// For GDP growth bar chart
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

const charts = computed(() => {
    if (!data.value) return []
    return SERIES.map(s => {
        const points = data.value[s.key] ?? []
        if (!points.length) return { ...s, empty: true }
        if (s.key === 'gdpGrowth') {
            return { ...s, bars: buildGrowthBars(points), points }
        }
        return { ...s, spark: buildSparkPath(points), points }
    })
})
</script>

<template>
    <Teleport to="body">
        <Transition enter-active-class="transition-opacity duration-200 ease-out"
            leave-active-class="transition-opacity duration-150 ease-in" enter-from-class="opacity-0"
            leave-to-class="opacity-0">
            <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4"
                @click.self="$emit('close')">

                <!-- Backdrop -->
                <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="$emit('close')" />

                <!-- Panel -->
                <div class="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto
                            bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl">

                    <!-- Header -->
                    <div class="sticky top-0 bg-gray-950/95 backdrop-blur-md
                                flex items-center justify-between px-6 py-4
                                border-b border-gray-800 z-10">
                        <div class="flex items-center gap-3">
                            <img v-if="countryData?.flag" :src="countryData.flag" :alt="countryData.name + ' flag'"
                                class="w-10 h-6 object-cover rounded shadow border border-gray-700" />
                            <div>
                                <h2 class="text-white font-bold text-lg leading-tight">
                                    {{ countryData?.name ?? country?.name }}
                                </h2>
                                <p class="text-gray-500 text-xs">Detailed economic &amp; demographic indicators</p>
                            </div>
                        </div>
                        <button @click="$emit('close')"
                            class="text-gray-400 hover:text-white text-2xl leading-none transition-colors"
                            aria-label="Close">
                            &times;
                        </button>
                    </div>

                    <!-- Body -->
                    <div class="px-6 py-6">

                        <!-- Loading -->
                        <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-3">
                            <div
                                class="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            <p class="text-gray-400 text-sm">Loading World Bank data…</p>
                        </div>

                        <!-- Error -->
                        <div v-else-if="error" class="rounded-lg bg-red-900/40 border border-red-700 p-4 text-sm">
                            <p class="font-semibold text-red-300 mb-1">Failed to load data</p>
                            <p class="text-red-400">{{ error }}</p>
                        </div>

                        <!-- Charts -->
                        <div v-else-if="charts.length" class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div v-for="chart in charts" :key="chart.key"
                                class="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
                                <p class="text-gray-400 text-xs uppercase tracking-widest mb-3">{{ chart.label }}</p>

                                <!-- No data -->
                                <div v-if="chart.empty || (!chart.spark && !chart.bars)"
                                    class="flex items-center justify-center h-16 text-gray-600 text-xs">
                                    No data available
                                </div>

                                <!-- Line sparkline -->
                                <template v-else-if="chart.spark">
                                    <svg :width="SPARK_W" :height="SPARK_H" class="w-full h-auto overflow-visible">
                                        <!-- Fill area -->
                                        <path :d="chart.spark.fill" fill="rgba(96,165,250,0.12)" />
                                        <!-- Line -->
                                        <path :d="chart.spark.d" fill="none" stroke="#60a5fa" stroke-width="1.5"
                                            stroke-linejoin="round" stroke-linecap="round" />
                                    </svg>
                                    <div class="flex justify-between text-gray-600 text-xs mt-1">
                                        <span>{{ chart.spark.minY }}</span>
                                        <span class="text-gray-300 font-medium">
                                            {{ chart.format(chart.spark.maxV) }}
                                            <span class="text-gray-600 font-normal"> peak</span>
                                        </span>
                                        <span>{{ chart.spark.maxY }}</span>
                                    </div>
                                </template>

                                <!-- Growth bar chart -->
                                <template v-else-if="chart.bars">
                                    <svg :width="SPARK_W" :height="SPARK_H" class="w-full h-auto overflow-visible">
                                        <!-- Zero line -->
                                        <line :x1="SPARK_PAD" :y1="SPARK_H / 2" :x2="SPARK_W - SPARK_PAD"
                                            :y2="SPARK_H / 2" stroke="#374151" stroke-width="0.5" />
                                        <!-- Bars -->
                                        <rect v-for="bar in chart.bars" :key="bar.year" :x="bar.x" :y="bar.y"
                                            :width="bar.w" :height="bar.h" :fill="bar.positive ? '#4ade80' : '#f87171'"
                                            fill-opacity="0.8" rx="1" />
                                    </svg>
                                    <div class="flex justify-between text-gray-600 text-xs mt-1">
                                        <span>{{Math.min(...chart.points.map(p => p.year))}}</span>
                                        <span class="text-gray-500">positive <span class="text-green-400">▌</span>
                                            negative <span class="text-red-400">▌</span></span>
                                        <span>{{Math.max(...chart.points.map(p => p.year))}}</span>
                                    </div>
                                </template>

                                <!-- Latest value pill -->
                                <div class="mt-2 text-right">
                                    <span class="text-cyan-300 font-mono text-sm font-semibold">
                                        {{ chart.format(chart.points[chart.points.length - 1]?.value) }}
                                    </span>
                                    <span class="text-gray-600 text-xs ml-1">
                                        ({{ chart.points[chart.points.length - 1]?.year }})
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- No WB data at all (e.g. Taiwan, Kosovo) -->
                        <div v-else class="text-center py-16 text-gray-600 text-sm">
                            No World Bank data available for this country.
                        </div>

                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
