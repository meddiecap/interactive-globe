<script setup>
import { watch, computed, ref, onUnmounted } from 'vue'
import ct from 'countries-and-timezones'
import { useApi } from '../composables/useApi.js'

const props = defineProps({
    country: { type: Object, default: null },
    open: { type: Boolean, default: false },
})
defineEmits(['close', 'showDetail'])

const { countryData, loading, error, wbData, wbLoading, wbError, fetchCountry } = useApi()

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
// World Bank indicator formatting
// ---------------------------------------------------------------------------

function fmtGdp(v) {
    if (v == null) return null
    if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
    if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
    return `$${(v / 1e6).toFixed(1)}M`
}

function fmtGdpPerCapita(v) {
    if (v == null) return null
    return `$${Math.round(v).toLocaleString()}`
}

function fmtGrowth(v) {
    if (v == null) return null
    return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`
}

function fmtLifeExp(v) {
    if (v == null) return null
    return `${v.toFixed(1)} yrs`
}

const wbRows = computed(() => {
    if (!wbData.value) return []
    const d = wbData.value
    return [
        { label: 'GDP', value: fmtGdp(d.gdp?.value), year: d.gdp?.date, colorClass: '' },
        { label: 'GDP per capita', value: fmtGdpPerCapita(d.gdpPerCapita?.value), year: d.gdpPerCapita?.date, colorClass: '' },
        {
            label: 'GDP growth', value: fmtGrowth(d.gdpGrowth?.value), year: d.gdpGrowth?.date,
            colorClass: d.gdpGrowth?.value != null
                ? (d.gdpGrowth.value >= 0 ? 'text-green-400' : 'text-red-400')
                : ''
        },
        { label: 'Life expectancy', value: fmtLifeExp(d.lifeExp?.value), year: d.lifeExp?.date, colorClass: '' },
    ].filter(row => row.value !== null)
})

// ---------------------------------------------------------------------------
// Live local time — IANA-based (DST-correct, includes territory labels)
// ---------------------------------------------------------------------------

/**
 * Convert an IANA name like "Pacific/Marquesas" or "America/Indiana/Indianapolis"
 * to a readable label: last path segment, underscores → spaces.
 */
function ianaToLabel(ianaName) {
    const parts = ianaName.split('/')
    return parts[parts.length - 1].replace(/_/g, ' ')
}

function getIanaTime(ianaName) {
    try {
        return new Intl.DateTimeFormat([], {
            timeZone: ianaName,
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false,
        }).format(new Date())
    } catch {
        return '--:--:--'
    }
}

const tick = ref(0)
const timer = setInterval(() => { tick.value++ }, 1000)
onUnmounted(() => clearInterval(timer))

// Max labels to show inline before showing "+ N more"
const MAX_LABELS = 3

const localTimes = computed(() => {
    tick.value // reactive dependency — re-runs every second
    const code = props.country?.code
    if (!code) return []
    const info = ct.getCountry(code)
    if (!info?.timezones?.length) return []

    // Build one entry per IANA name, then group by current time value
    const entries = info.timezones.map((ianaName) => {
        const tzInfo = ct.getTimezone(ianaName)
        return {
            ianaName,
            label: ianaToLabel(ianaName),
            utcOffset: tzInfo?.utcOffsetStr ?? '',
            time: getIanaTime(ianaName),
        }
    })

    // Group entries that share the exact same time string
    const groups = new Map()
    for (const entry of entries) {
        const key = entry.time
        if (!groups.has(key)) {
            groups.set(key, { time: entry.time, utcOffset: entry.utcOffset, labels: [] })
        }
        groups.get(key).labels.push(entry.label)
    }

    // Convert to array, sort by UTC offset string so groups appear west→east
    return [...groups.values()].sort((a, b) => a.utcOffset.localeCompare(b.utcOffset))
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

                <!-- Detailed info button -->
                <button @click="$emit('showDetail')" class="w-full mt-5 py-2 rounded-lg border border-blue-700 bg-blue-950/40
                           text-blue-300 text-sm font-medium hover:bg-blue-900/50
                           transition-colors">
                    Detailed info &amp; charts →
                </button>

                <!-- World Bank economic indicators -->
                <div class="mt-4">
                    <div v-if="wbLoading" class="flex items-center gap-2 text-gray-500 text-xs py-2">
                        <div
                            class="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                        <span>Loading economic data…</span>
                    </div>
                    <div v-else-if="wbRows.length" class="rounded-lg border border-gray-700 bg-gray-900/60 p-4">
                        <p class="text-gray-400 text-xs uppercase tracking-widest mb-3">Economic indicators</p>
                        <dl class="space-y-2 text-sm">
                            <div v-for="row in wbRows" :key="row.label"
                                class="flex justify-between gap-3 border-b border-gray-800 pb-2">
                                <dt class="text-gray-500 shrink-0">{{ row.label }}</dt>
                                <dd class="text-right">
                                    <span :class="row.colorClass || 'text-gray-200'">{{ row.value }}</span>
                                    <span v-if="row.year" class="block text-gray-600 text-xs">{{ row.year }}</span>
                                </dd>
                            </div>
                        </dl>
                    </div>
                    <div v-else-if="wbError" class="text-gray-600 text-xs py-2">Economic data unavailable</div>
                </div>

                <!-- Local time(s) -->
                <div v-if="localTimes.length" class="mt-4 rounded-lg border border-gray-700 bg-gray-900/60 p-4">
                    <p class="text-gray-400 text-xs uppercase tracking-widest mb-3">Local time</p>
                    <div class="space-y-3">
                        <div v-for="group in localTimes" :key="group.time"
                            class="flex items-start justify-between gap-2">
                            <div class="min-w-0">
                                <p class="text-gray-200 text-xs font-medium leading-snug">
                                    {{ group.labels.slice(0, MAX_LABELS).join(', ') }}<span
                                        v-if="group.labels.length > MAX_LABELS" class="ml-1 text-gray-500">+{{
                                            group.labels.length - MAX_LABELS }} more</span>
                                </p>
                                <p class="text-gray-500 text-xs mt-0.5">{{ group.utcOffset }}</p>
                            </div>
                            <span class="font-mono text-blue-300 text-sm tabular-nums shrink-0 mt-0.5">{{ group.time
                                }}</span>
                        </div>
                    </div>
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
