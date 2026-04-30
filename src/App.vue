<script setup>
import { ref, onMounted } from 'vue'
import { useCountriesStore } from './composables/useCountriesStore.js'
import Globe from './components/Globe.vue'

const { loadCountries } = useCountriesStore()
onMounted(() => loadCountries())
import Sidebar from './components/Sidebar.vue'
import SearchBar from './components/SearchBar.vue'
import Overlay from './components/Overlay.vue'

const globeRef = ref(null)
const selectedCountry = ref(null)
const sidebarOpen = ref(false)

function onCountrySelected(country) {
    selectedCountry.value = country
    sidebarOpen.value = true
}

function onSearchSelect(country) {
    // Delegate camera animation + selection to the Globe component
    globeRef.value?.focusCountry(country)
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
        </div>

        <!-- Slide-in sidebar -->
        <Sidebar :country="selectedCountry" :open="sidebarOpen" @close="sidebarOpen = false" />

        <!-- Instruction overlay (dismissible) -->
        <Overlay />
    </div>
</template>
