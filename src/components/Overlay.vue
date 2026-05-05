<script setup>
import { ref } from 'vue'

const visible = ref(true)
</script>

<template>
    <Transition name="fade">
        <div v-if="visible" class="
        fixed bottom-14 left-8 z-10 max-w-xs
        bg-gray-900/85 backdrop-blur-sm
        border border-gray-700 rounded-xl p-4
        text-sm text-gray-300 shadow-xl
      ">
            <p class="font-semibold text-white mb-2">How to explore</p>
            <ul class="space-y-1.5 text-gray-400">
                <li>🌍&nbsp; Drag to rotate the globe</li>
                <li>🔍&nbsp; Scroll to zoom in / out</li>
                <li>📍&nbsp; Click a country to explore</li>
                <li>🔎&nbsp; Search countries in the bar above</li>
            </ul>
            <button @click="visible = false"
                class="mt-3 text-xs text-gray-600 hover:text-gray-400 underline transition-colors">
                Dismiss
            </button>
        </div>
    </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
