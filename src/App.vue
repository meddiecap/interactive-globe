<script setup>
import { ref, onMounted } from 'vue'
import { useCountriesStore } from './composables/useCountriesStore.js'
import Globe from './components/Globe.vue'
import Sidebar from './components/Sidebar.vue'
import SearchBar from './components/SearchBar.vue'
import Overlay from './components/Overlay.vue'
import CountryDetailModal from './components/CountryDetailModal.vue'
import CompareModal from './components/CompareModal.vue'

const { loadCountries } = useCountriesStore()
onMounted(() => loadCountries())

const globeRef = ref(null)
const selectedCountry = ref(null)
const sidebarOpen = ref(false)
const detailOpen = ref(false)
const compareOpen = ref(false)
const isRotating = ref(true)

function onCountrySelected(country) {
    selectedCountry.value = country
    sidebarOpen.value = true
    detailOpen.value = false
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
                🌍 Interactive Globe
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
        <Sidebar :country="selectedCountry" :open="sidebarOpen" @close="sidebarOpen = false"
            @showDetail="detailOpen = true" @showCompare="compareOpen = true" />

        <!-- Country detail modal -->
        <CountryDetailModal :country="selectedCountry" :open="detailOpen" @close="detailOpen = false" />

        <!-- Compare modal -->
        <CompareModal :open="compareOpen" @close="compareOpen = false" />

        <!-- Instruction overlay (dismissible) -->
        <Overlay />

        <!-- Attribution links -->
        <div class="absolute bottom-5 left-13 z-10 flex items-center gap-3 text-xs text-gray-500">
            <a href="https://www.linkedin.com/in/mbronneberg/" target="_blank" rel="noopener noreferrer"
                class="flex items-center gap-1 hover:text-blue-400 transition-colors">
                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
            </a>
            <span class="text-gray-700">·</span>
            <a href="https://github.com/meddiecap/interactive-globe" target="_blank" rel="noopener noreferrer"
                class="flex items-center gap-1 hover:text-white transition-colors">
                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                GitHub
            </a>
        </div>
    </div>
</template>
