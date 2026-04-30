import { ref } from 'vue'

// Module-level singleton — the same ref is shared across all imports
const countries = ref([])
let loaded = false

export function useCountriesStore() {
  async function loadCountries() {
    if (loaded) return
    try {
      const res = await fetch(
        'https://restcountries.com/v3.1/all?fields=name,cca2,latlng'
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      countries.value = data
        .filter((c) => c.latlng?.length === 2)
        .map((c) => ({
          name: c.name.common,
          code: c.cca2,
          lat:  c.latlng[0],
          lon:  c.latlng[1],
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
      loaded = true
    } catch (e) {
      console.warn('Could not load country list from API, using built-in fallback:', e.message)
    }
  }

  return { countries, loadCountries }
}
