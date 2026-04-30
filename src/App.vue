<script setup>
import { ref, onMounted } from 'vue'
import { useCountriesStore } from './composables/useCountriesStore.js'
import Globe from './components/Globe.vue'
import Sidebar from './components/Sidebar.vue'
import SearchBar from './components/SearchBar.vue'
import Overlay from './components/Overlay.vue'

const { loadCountries } = useCountriesStore()
onMounted(() => loadCountries())

const globeRef = ref(null)
const selectedCountry = ref(null)
const sidebarOpen = ref(false)
const isRotating = ref(true)

function onCountrySelected(country) {
    selectedCountry.value = country
    sidebarOpen.value = true
}

function onSearchSelect(country) {
    globeRef.value?.focusCountry(country)
}

function toggleRotation() {
    globeRef.value?.toggleRotation()
    isRotating.value = !isRotating.value
}
</script>

<template>
    <div class="relative w-screen h-screen bg-black overflow-hidden">

        <!-- Three.js canvas fills the entire viewport -->
        <Globe ref="globeRef" class="absolute inset-0" @countrySelected="onCountrySelected" />

        <!-- Top-left toolbar -->
        <div class="absolute top-6 left-6 z-10 flex items-center gap-4">
            <span class="text-white font-bold text-base tracking-widest select-none">
                🌍 Country Globe
            </span>
            <SearchBar @select="onSearchSelect" />
            <button @click="toggleRotation"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
                :class="isRotating
                    ? 'bg-blue-900/60 border-blue-700 text-blue-300 hover:bg-blue-800/60'
                    : 'bg-gray-800/60 border-gray-600 text-gray-400 hover:bg-gray-700/60'">
                <span>{{ isRotating ? '⏸' : '▶' }}</span>
                {{ isRotating ? 'Pause' : 'Rotate' }}
            </button>
        </div>

        <!-- Slide-in sidebar -->
        <Sidebar :country="selectedCountry" :open="sidebarOpen" @close="sidebarOpen = false" />

        <!-- Instruction overlay (dismissible) -->
        <Overlay />
    </div>
</template>
