<script setup>
import { watch, computed } from 'vue'
import { useWorldBankTimeseries } from '../composables/useWorldBankTimeseries.js'
import { useApi } from '../composables/useApi.js'
import ChartCard from './modal/ChartCard.vue'

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

const charts = computed(() => {
    if (!data.value) return []
    return SERIES.map(s => {
        const points = data.value[s.key] ?? []
        return { key: s.key, label: s.label, format: s.format, points, empty: !points.length }
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
                            <ChartCard v-for="chart in charts" :key="chart.key" :chart="chart" />
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
