<script setup>
defineProps({
    flag: { type: String, default: null },
    name: { type: String, default: '' },
    officialName: { type: String, default: '' },
})
</script>

<template>
    <div class="flex items-center gap-3 mb-5">
        <img :src="flag" :alt="name + ' flag'"
            class="w-16 h-10 object-cover rounded shadow-lg border border-gray-700" />
        <div>
            <h3 class="font-bold text-lg leading-snug">{{ name }}</h3>
            <p class="text-gray-500 text-xs mt-0.5">{{ officialName }}</p>
        </div>
    </div>
</template>
