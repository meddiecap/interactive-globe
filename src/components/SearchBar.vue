<script setup>
import { ref, computed } from 'vue'
import { useCountriesStore } from '../composables/useCountriesStore.js'

const { countries: countriesData } = useCountriesStore()

const emit = defineEmits(['select'])

const query = ref('')
const isOpen = ref(false)

const filtered = computed(() => {
    const q = query.value.trim().toLowerCase()
    if (!q) return []
    return countriesData.value
        .filter((c) => c.name.toLowerCase().includes(q))
        .slice(0, 8)
})

function select(country) {
    emit('select', country)
    query.value = ''
    isOpen.value = false
}

function onBlur() {
    // Delay so mousedown on a result fires before the list hides
    setTimeout(() => { isOpen.value = false }, 150)
}
</script>

<template>
    <div class="relative w-60">
        <input v-model="query" @focus="isOpen = true" @blur="onBlur" type="text" placeholder="Search countries…" class="
        w-full rounded-lg px-4 py-2 text-sm
        bg-gray-900/80 backdrop-blur-sm text-white placeholder-gray-500
        border border-gray-700 focus:border-blue-400 focus:outline-none
        transition-colors
      " />

        <ul v-if="isOpen && filtered.length" class="
        absolute top-full mt-1 w-full z-50
        bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-2xl
      ">
            <li v-for="country in filtered" :key="country.code" @mousedown.prevent="select(country)"
                class="flex items-center gap-2 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 cursor-pointer transition-colors">
                <img v-if="country.flag" :src="country.flag" :alt="country.name"
                    class="w-5 h-3.5 object-cover rounded-sm shrink-0" />
                {{ country.name }}
            </li>
        </ul>
    </div>
</template>
