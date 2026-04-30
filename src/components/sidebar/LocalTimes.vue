<script setup>
import { computed, ref, onUnmounted } from 'vue'
import ct from 'countries-and-timezones'

const props = defineProps({
    countryCode: { type: String, default: null },
})

const MAX_LABELS = 3

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

const localTimes = computed(() => {
    tick.value // reactive dependency — re-runs every second
    if (!props.countryCode) return []
    const info = ct.getCountry(props.countryCode)
    if (!info?.timezones?.length) return []

    const entries = info.timezones.map((ianaName) => {
        const tzInfo = ct.getTimezone(ianaName)
        return {
            ianaName,
            label: ianaToLabel(ianaName),
            utcOffset: tzInfo?.utcOffsetStr ?? '',
            time: getIanaTime(ianaName),
        }
    })

    const groups = new Map()
    for (const entry of entries) {
        const key = entry.time
        if (!groups.has(key)) {
            groups.set(key, { time: entry.time, utcOffset: entry.utcOffset, labels: [] })
        }
        groups.get(key).labels.push(entry.label)
    }

    return [...groups.values()].sort((a, b) => a.utcOffset.localeCompare(b.utcOffset))
})
</script>

<template>
    <div v-if="localTimes.length" class="mt-4 rounded-lg border border-gray-700 bg-gray-900/60 p-4">
        <p class="text-gray-400 text-xs uppercase tracking-widest mb-3">Local time</p>
        <div class="space-y-3">
            <div v-for="group in localTimes" :key="group.time" class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                    <p class="text-gray-200 text-xs font-medium leading-snug">
                        {{ group.labels.slice(0, MAX_LABELS).join(', ') }}<span v-if="group.labels.length > MAX_LABELS"
                            class="ml-1 text-gray-500">+{{ group.labels.length - MAX_LABELS }} more</span>
                    </p>
                    <p class="text-gray-500 text-xs mt-0.5">{{ group.utcOffset }}</p>
                </div>
                <span class="font-mono text-blue-300 text-sm tabular-nums shrink-0 mt-0.5">{{ group.time }}</span>
            </div>
        </div>
    </div>
</template>
