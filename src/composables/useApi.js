import { ref } from 'vue'

const BASE_URL = 'https://restcountries.com/v3.1/alpha'

export function useApi() {
  const countryData = ref(null)
  const loading     = ref(false)
  const error       = ref(null)

  async function fetchCountry(code) {
    loading.value     = true
    error.value       = null
    countryData.value = null

    try {
      const res = await fetch(`${BASE_URL}/${code}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const [data] = await res.json()

      countryData.value = {
        name:       data.name?.common,
        officialName: data.name?.official,
        flag:       data.flags?.svg ?? data.flags?.png,
        capital:    data.capital?.[0] ?? 'N/A',
        region:     data.region,
        subregion:  data.subregion,
        population: data.population,
        area:       data.area,
        languages:  data.languages
          ? Object.values(data.languages).join(', ')
          : 'N/A',
        currencies: data.currencies
          ? Object.values(data.currencies)
              .map((c) => `${c.name} (${c.symbol ?? '?'})`)
              .join(', ')
          : 'N/A',
        timezones: data.timezones ?? [],
      }
    } catch (e) {
      error.value = e.message ?? 'Failed to fetch country data'
    } finally {
      loading.value = false
    }
  }

  // Placeholder for future World Bank integration
  // https://api.worldbank.org/v2/country/{code}/indicator/NY.GDP.MKTP.CD?format=json
  async function fetchWorldBankStats(_code) {
    return null
  }

  return { countryData, loading, error, fetchCountry, fetchWorldBankStats }
}
