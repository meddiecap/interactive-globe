import { ref } from 'vue'

const BASE_URL = 'https://restcountries.com/v3.1/alpha'
const WB_BASE  = 'https://api.worldbank.org/v2/country'

// World Bank indicator codes
const WB_INDICATORS = {
  gdp:          'NY.GDP.MKTP.CD',   // GDP (current US$)
  gdpPerCapita: 'NY.GDP.PCAP.CD',   // GDP per capita (current US$)
  gdpGrowth:    'NY.GDP.MKTP.KD.ZG', // GDP growth (annual %)
  lifeExp:      'SP.DYN.LE00.IN',   // Life expectancy at birth
}

async function fetchWbIndicator(code, indicator) {
  const res = await fetch(
    `${WB_BASE}/${code}/indicator/${indicator}?format=json&mrv=1`
  )
  if (!res.ok) return null
  const json = await res.json()
  return {
    value: json?.[1]?.[0]?.value ?? null,
    date:  json?.[1]?.[0]?.date  ?? null,
  }
}

// Module-level singletons — shared across all callers (Sidebar, Modal, etc.)
const countryData = ref(null)
const loading     = ref(false)
const error       = ref(null)
const wbData      = ref(null)
const wbLoading   = ref(false)
const wbError     = ref(null)

export function useApi() {

  async function fetchWorldBankStats(code) {
    wbLoading.value = true
    wbError.value   = null
    wbData.value    = null
    try {
      const entries = await Promise.all(
        Object.entries(WB_INDICATORS).map(async ([key, indicator]) => {
          const result = await fetchWbIndicator(code, indicator)
          return [key, result]
        })
      )
      wbData.value = Object.fromEntries(entries)
    } catch (e) {
      wbError.value = e.message ?? 'World Bank fetch failed'
    } finally {
      wbLoading.value = false
    }
  }

  async function fetchCountry(code) {
    loading.value     = true
    error.value       = null
    countryData.value = null

    // Start WB fetch concurrently — has its own loading/error state
    fetchWorldBankStats(code)

    try {
      const res = await fetch(`${BASE_URL}/${code}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const [data] = await res.json()

      countryData.value = {
        name:         data.name?.common,
        officialName: data.name?.official,
        flag:         data.flags?.svg ?? data.flags?.png,
        capital:      data.capital?.[0] ?? 'N/A',
        region:       data.region,
        subregion:    data.subregion,
        population:   data.population,
        area:         data.area,
        languages:    data.languages
          ? Object.values(data.languages).join(', ')
          : 'N/A',
        currencies:   data.currencies
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

  return { countryData, loading, error, wbData, wbLoading, wbError, fetchCountry, fetchWorldBankStats }
}
