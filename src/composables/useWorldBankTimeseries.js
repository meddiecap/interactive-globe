import { ref } from 'vue'

// In dev, requests go through the Vite proxy to avoid CORS blocks from localhost.
// In production (real domain), the World Bank API allows cross-origin requests.
const WB_BASE = import.meta.env.DEV
  ? '/wb-api'
  : 'https://api.worldbank.org/v2/country'

const SERIES = [
  { key: 'gdp',        indicator: 'NY.GDP.MKTP.CD',    label: 'GDP (USD)',          format: fmtGdpShort },
  { key: 'gdpGrowth',  indicator: 'NY.GDP.MKTP.KD.ZG', label: 'GDP Growth (%)',     format: fmtGrowth },
  { key: 'population', indicator: 'SP.POP.TOTL',        label: 'Population',         format: fmtPopShort },
  { key: 'lifeExp',    indicator: 'SP.DYN.LE00.IN',     label: 'Life expectancy (yrs)', format: fmtFixed1 },
]

function fmtGdpShort(v) {
  if (v == null) return ''
  if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}T`
  if (v >= 1e9)  return `$${(v / 1e9).toFixed(1)}B`
  return `$${(v / 1e6).toFixed(1)}M`
}

function fmtPopShort(v) {
  if (v == null) return ''
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  return v.toLocaleString()
}

function fmtGrowth(v) {
  if (v == null) return ''
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`
}

function fmtFixed1(v) {
  if (v == null) return ''
  return v.toFixed(1)
}

async function fetchSeries(code, indicator) {
  const res = await fetch(
    `${WB_BASE}/${code}/indicator/${indicator}?format=json&mrv=25&per_page=25`
  )
  if (!res.ok) return []
  const json = await res.json()
  return (json?.[1] ?? [])
    .filter(d => d.value != null)
    .map(d => ({ year: parseInt(d.date), value: d.value }))
    .sort((a, b) => a.year - b.year)
}

export function useWorldBankTimeseries() {
  const data     = ref(null)   // { gdp: [{year, value}], gdpGrowth: [...], ... }
  const loading  = ref(false)
  const error    = ref(null)

  async function fetchAll(code) {
    loading.value = true
    error.value   = null
    data.value    = null
    try {
      const results = await Promise.all(
        SERIES.map(s => fetchSeries(code, s.indicator).then(points => [s.key, points]))
      )
      data.value = Object.fromEntries(results)
    } catch (e) {
      error.value = e.message ?? 'Failed to fetch timeseries'
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, fetchAll, SERIES }
}
