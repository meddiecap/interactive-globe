<script setup>
import { watch, computed, ref, onUnmounted } from 'vue'
import { useApi } from '../composables/useApi.js'

const props = defineProps({
    country: { type: Object, default: null },
    open: { type: Boolean, default: false },
})
defineEmits(['close'])

const { countryData, loading, error, fetchCountry } = useApi()

watch(
    () => props.country,
    (c) => { if (c) fetchCountry(c.code) }
)

function fmt(n) {
    return n != null ? n.toLocaleString() : 'N/A'
}

const rows = computed(() => {
    if (!countryData.value) return []
    const d = countryData.value
    return [
        { label: 'Capital', value: d.capital },
        { label: 'Region', value: [d.region, d.subregion].filter(Boolean).join(' — ') },
        { label: 'Population', value: fmt(d.population) },
        { label: 'Area', value: d.area != null ? `${fmt(d.area)} km²` : 'N/A' },
        { label: 'Languages', value: d.languages },
        { label: 'Currency', value: d.currencies },
    ]
})

// ---------------------------------------------------------------------------
// Live local time
// ---------------------------------------------------------------------------

/**
 * Parse a "UTC+HH:MM" or "UTC-HH:MM" or "UTC" string into total minutes offset.
 */
function parseUtcOffset(tz) {
    if (!tz || tz === 'UTC') return 0
    const m = tz.match(/UTC([+-])(\d{1,2}):(\d{2})/)
    if (!m) return 0
    const sign = m[1] === '+' ? 1 : -1
    const hours = parseInt(m[2], 10)
    const minutes = parseInt(m[3], 10)
    return sign * (hours * 60 + minutes)
}

function getLocalTime(tzString) {
    const offsetMinutes = parseUtcOffset(tzString)
    const utcMs = Date.now() + new Date().getTimezoneOffset() * 60000
    const localMs = utcMs + offsetMinutes * 60000
    const d = new Date(localMs)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

const tick = ref(0)
const timer = setInterval(() => { tick.value++ }, 1000)
onUnmounted(() => clearInterval(timer))

const localTimes = computed(() => {
    tick.value // reactive dependency — re-runs every second
    const tzs = countryData.value?.timezones
    if (!tzs?.length) return []
    return tzs.map((tz) => ({ tz, time: getLocalTime(tz) }))
})
</script>

<template>
    <aside :class="[
        'fixed top-0 right-0 h-full w-80 z-20 flex flex-col',
        'bg-gray-950/95 backdrop-blur-md text-white shadow-2xl',
        'transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : 'translate-x-full',
    ]">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
            <h2 class="text-lg font-bold tracking-wide text-blue-300">Country Info</h2>
            <button @click="$emit('close')"
                class="text-gray-400 hover:text-white text-2xl leading-none transition-colors"
                aria-label="Close sidebar">
                &times;
            </button>
        </div>

        <!-- Scrollable body -->
        <div class="flex-1 overflow-y-auto px-6 py-4">

            <!-- Loading -->
            <div v-if="loading" class="flex flex-col items-center justify-center py-16 gap-3">
                <div class="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <p class="text-gray-400 text-sm">Fetching data…</p>
            </div>

            <!-- Error -->
            <div v-else-if="error" class="rounded-lg bg-red-900/40 border border-red-700 p-4 text-sm">
                <p class="font-semibold text-red-300 mb-1">Request failed</p>
                <p class="text-red-400">{{ error }}</p>
            </div>

            <!-- Country data -->
            <template v-else-if="countryData">
                <!-- Flag + name -->
                <div class="flex items-center gap-3 mb-5">
                    <img :src="countryData.flag" :alt="countryData.name + ' flag'"
                        class="w-16 h-10 object-cover rounded shadow-lg border border-gray-700" />
                    <div>
                        <h3 class="font-bold text-lg leading-snug">{{ countryData.name }}</h3>
                        <p class="text-gray-500 text-xs mt-0.5">{{ countryData.officialName }}</p>
                    </div>
                </div>

                <!-- Data rows -->
                <dl class="space-y-2 text-sm">
                    <div v-for="row in rows" :key="row.label"
                        class="flex justify-between gap-3 border-b border-gray-800 pb-2">
                        <dt class="text-gray-500 shrink-0">{{ row.label }}</dt>
                        <dd class="text-right text-gray-200">{{ row.value }}</dd>
                    </div>
                </dl>

                <!-- Local time(s) -->
                <div v-if="localTimes.length" class="mt-4 rounded-lg border border-gray-700 bg-gray-900/60 p-4">
                    <p class="text-gray-400 text-xs uppercase tracking-widest mb-3">Local time</p>
                    <div class="space-y-2">
                        <div v-for="entry in localTimes" :key="entry.tz"
                            class="flex items-center justify-between gap-3">
                            <span class="text-gray-500 text-xs">{{ entry.tz }}</span>
                            <span class="font-mono text-blue-300 text-sm tabular-nums">{{ entry.time }}</span>
                        </div>
                    </div>
                </div>

                <!-- World Bank placeholder -->
                <div class="mt-6 rounded-lg border border-blue-900 bg-blue-950/40 p-4">
                    <p class="text-blue-300 font-semibold text-sm mb-1">Coming next</p>
                    <p class="text-gray-500 text-xs leading-relaxed">
                        GDP trend, population growth, and trade data via the World Bank API.
                    </p>
                </div>
            </template>

            <!-- Empty state -->
            <div v-else class="flex flex-col items-center justify-center py-16 gap-2 text-center">
                <span class="text-4xl">📍</span>
                <p class="text-gray-500 text-sm">Click a marker on the globe<br />to explore a country</p>
            </div>
        </div>
    </aside>
</template>
