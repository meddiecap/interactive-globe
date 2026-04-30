import { ref } from 'vue'

const COLORS = ['#60a5fa', '#f472b6', '#34d399', '#fb923c']
const MAX_COUNTRIES = 4

// Module-level singleton — shared across Sidebar, CompareModal, etc.
const compareCountries = ref([]) // [{ code, name, color, ...rest }]

export function useCompare() {
  function isInCompare(code) {
    return compareCountries.value.some(c => c.code === code)
  }

  function addToCompare(country) {
    if (isInCompare(country.code)) return
    if (compareCountries.value.length >= MAX_COUNTRIES) return
    const color = COLORS[compareCountries.value.length]
    compareCountries.value = [...compareCountries.value, { ...country, color }]
  }

  function removeFromCompare(code) {
    // Re-assign colors after removal so the palette stays consistent
    compareCountries.value = compareCountries.value
      .filter(c => c.code !== code)
      .map((c, i) => ({ ...c, color: COLORS[i] }))
  }

  function clearCompare() {
    compareCountries.value = []
  }

  return { compareCountries, isInCompare, addToCompare, removeFromCompare, clearCompare, MAX_COUNTRIES }
}
