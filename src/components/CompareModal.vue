<script setup>
import { ref, computed, watch } from 'vue'
import { useCompare } from '../composables/useCompare.js'
import { useCompareTimeseries } from '../composables/useWorldBankTimeseries.js'
import { useCountriesStore } from '../composables/useCountriesStore.js'
import CompareChartCard from './modal/CompareChartCard.vue'

const props = defineProps({
    open: { type: Boolean, default: false },
})
defineEmits(['close'])

const { compareCountries, removeFromCompare, addToCompare, isInCompare, clearCompare, MAX_COUNTRIES } = useCompare()
const { data, loading, error, fetchAll, SERIES } = useCompareTimeseries()
const { countries } = useCountriesStore()

// Re-fetch whenever the modal opens or the compare list changes
watch(
    [() => props.open, compareCountries],
    ([isOpen]) => {
        if (isOpen && compareCountries.value.length) {
            fetchAll(compareCountries.value.map(c => c.code))
        }
    },
    { deep: true }
)

// ── Inline country search ────────────────────────────────────────────────────
const searchQuery = ref('')
const searchOpen = ref(false)

const filteredCountries = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return []
    return countries.value
        .filter(c => c.name.toLowerCase().includes(q) && !isInCompare(c.code))
        .slice(0, 8)
})

function selectCountry(country) {
    addToCompare(country)
    searchQuery.value = ''
    // Don't close searchOpen — the input keeps focus after selection, so @focus
    // won't re-fire. The dropdown hides naturally because filteredCountries is
    // empty when the query is cleared, and reopens as soon as the user types again.
}

function blurSearch() {
    // Small delay so mousedown on a result fires before the list disappears
    setTimeout(() => { searchOpen.value = false }, 150)
}

// ── Chart data ───────────────────────────────────────────────────────────────
const charts = computed(() => {
    if (!data.value) return []
    return SERIES.map(s => ({
        label: s.label,
        format: s.format,
        seriesKey: s.key,
        series: compareCountries.value.map(c => ({
            code: c.code,
            name: c.name,
            color: c.color,
            points: data.value[c.code]?.[s.key] ?? [],
        })),
    }))
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
                <div class="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto
                    bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl">

                    <!-- Header -->
                    <div class="sticky top-0 bg-gray-950/95 backdrop-blur-md
                      flex items-center justify-between px-6 py-4
                      border-b border-gray-800 z-10">
                        <div>
                            <h2 class="text-white font-bold text-lg leading-tight">Compare Countries</h2>
                            <p class="text-gray-500 text-xs">Up to {{ MAX_COUNTRIES }} countries — trends normalised per
                                indicator</p>
                        </div>
                        <button @click="$emit('close')"
                            class="text-gray-400 hover:text-white text-2xl leading-none transition-colors"
                            aria-label="Close">
                            &times;
                        </button>
                    </div>

                    <!-- Body -->
                    <div class="px-6 py-5">

                        <!-- Country chips + add-search row -->
                        <div class="flex flex-wrap items-center gap-2 mb-5">

                            <!-- Selected country chips -->
                            <div v-for="c in compareCountries" :key="c.code"
                                class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                                :style="{ borderColor: c.color + '80', backgroundColor: c.color + '18', color: c.color }">
                                <span>{{ c.name }}</span>
                                <button @click="removeFromCompare(c.code)"
                                    class="ml-0.5 opacity-60 hover:opacity-100 leading-none text-sm"
                                    :aria-label="`Remove ${c.name}`">
                                    ×
                                </button>
                            </div>

                            <!-- Add-country inline search -->
                            <div v-if="compareCountries.length < MAX_COUNTRIES" class="relative">
                                <input v-model="searchQuery" @focus="searchOpen = true" @blur="blurSearch"
                                    placeholder="+ Add country" class="px-3 py-1 rounded-full text-xs bg-gray-800 border border-gray-600
                              text-gray-300 placeholder-gray-600
                              focus:outline-none focus:border-blue-500 w-36" />
                                <div v-if="searchOpen && filteredCountries.length" class="absolute top-full left-0 mt-1 w-52 bg-gray-900 border border-gray-700
                            rounded-lg shadow-xl z-20 overflow-hidden">
                                    <button v-for="c in filteredCountries" :key="c.code"
                                        @mousedown.prevent="selectCountry(c)" class="w-full text-left px-3 py-1.5 text-xs text-gray-300
                                 hover:bg-gray-800 hover:text-white transition-colors">
                                        {{ c.name }}
                                    </button>
                                </div>
                            </div>

                            <!-- Clear all -->
                            <button v-if="compareCountries.length > 1" @click="clearCompare"
                                class="ml-auto text-xs text-gray-600 hover:text-red-400 transition-colors">
                                Clear all
                            </button>
                        </div>

                        <!-- Empty state -->
                        <div v-if="!compareCountries.length"
                            class="flex flex-col items-center justify-center py-16 gap-2 text-center">
                            <span class="text-3xl">⚖️</span>
                            <p class="text-gray-500 text-sm">Add countries above to start comparing.</p>
                        </div>

                        <!-- Loading -->
                        <div v-else-if="loading" class="flex flex-col items-center justify-center py-20 gap-3">
                            <div
                                class="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            <p class="text-gray-400 text-sm">Loading World Bank data…</p>
                        </div>

                        <!-- Error -->
                        <div v-else-if="error" class="rounded-lg bg-red-900/40 border border-red-700 p-4 text-sm">
                            <p class="font-semibold text-red-300 mb-1">Failed to load data</p>
                            <p class="text-red-400">{{ error }}</p>
                        </div>

                        <!-- Charts 2-column grid -->
                        <div v-else-if="charts.length" class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <CompareChartCard v-for="chart in charts" :key="chart.seriesKey" :label="chart.label"
                                :format="chart.format" :series-key="chart.seriesKey" :series="chart.series" />
                        </div>

                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
