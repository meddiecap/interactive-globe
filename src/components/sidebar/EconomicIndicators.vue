<script setup>
import { computed } from 'vue'

const props = defineProps({
    wbData: { type: Object, default: null },
    wbLoading: { type: Boolean, default: false },
    wbError: { type: String, default: null },
})

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

const rows = computed(() => {
    if (!props.wbData) return []
    const d = props.wbData
    return [
        { label: 'GDP', value: fmtGdp(d.gdp?.value), year: d.gdp?.date, colorClass: '' },
        { label: 'GDP per capita', value: fmtGdpPerCapita(d.gdpPerCapita?.value), year: d.gdpPerCapita?.date, colorClass: '' },
        {
            label: 'GDP growth', value: fmtGrowth(d.gdpGrowth?.value), year: d.gdpGrowth?.date,
            colorClass: d.gdpGrowth?.value != null
                ? (d.gdpGrowth.value >= 0 ? 'text-green-400' : 'text-red-400')
                : '',
        },
        { label: 'Life expectancy', value: fmtLifeExp(d.lifeExp?.value), year: d.lifeExp?.date, colorClass: '' },
    ].filter(row => row.value !== null)
})
</script>

<template>
    <div class="mt-4">
        <div v-if="wbLoading" class="flex items-center gap-2 text-gray-500 text-xs py-2">
            <div class="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
            <span>Loading economic data…</span>
        </div>
        <div v-else-if="rows.length" class="rounded-lg border border-gray-700 bg-gray-900/60 p-4">
            <p class="text-gray-400 text-xs uppercase tracking-widest mb-3">Economic indicators</p>
            <dl class="space-y-2 text-sm">
                <div v-for="row in rows" :key="row.label"
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
</template>
