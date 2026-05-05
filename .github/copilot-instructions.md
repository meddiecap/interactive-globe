# Copilot Instructions — Interactive Globe

## Project identity

Portfolio-quality proof-of-concept. Goal: impressive but simple 3D globe where users can explore countries and view data from external APIs.

---

## Tech stack (do not swap these out)

- **Vue 3** — Composition API only (`<script setup>`), never Options API
- **Three.js** — scene, OrbitControls, raycasting, animation loop
- **Tailwind CSS v4** — via `@tailwindcss/vite` plugin, no CDN
- **Vite** — dev server and build tool
- **ES modules** throughout (`"type": "module"` in package.json)
- **No TypeScript** — plain JavaScript only

---

## File structure conventions

> **Note:** This is a reference snapshot — the actual file tree may have evolved. Always verify with the real files before assuming a path or module exists.

```
src/
  main.js                        # Vue app entry
  App.vue                        # Root layout, global state
  assets/style.css               # Tailwind base + minimal globals
  components/
    Globe.vue                    # Three.js canvas + interaction
    Sidebar.vue                  # Country detail panel
    SearchBar.vue                # Filtered country search
    Overlay.vue                  # Dismissible instruction card
  composables/
    useGlobe.js                  # Scene, camera, renderer, controls, animation loop
    useBorders.js                # Country border geometry + hover/active highlights
    useCountriesStore.js         # Singleton: all countries from REST Countries API
    useApi.js                    # Fetch single country detail by alpha-2 code
    useCountries.js              # Re-exports shared geo helpers
  utils/
    geo.js                       # GLOBE_RADIUS constant + latLonToVector3()
  data/
    isoNumeric.js                # ISO 3166-1 numeric → alpha-2 lookup map
public/
  textures/
    8k_earth_daymap.jpg          # Earth surface texture (served statically)
```

---

## Architecture rules

### Vue

- Always use `<script setup>` syntax
- State lives in `ref` / `computed`; share state via composables, not props drilling
- Emit events up, pass props down — keep components focused
- Use `onMounted` / `onUnmounted` for Three.js lifecycle (setup + cleanup)
- Never use the Options API (`data()`, `methods:`, `created:`, etc.)

### Composables

- One concern per composable (`useGlobe` = scene setup, `useApi` = API calls, etc.)
- Composables return reactive refs and plain functions — no classes
- Module-level singletons (e.g. `useCountriesStore`) are allowed when the data must be shared across components without Pinia

### Three.js

- `GLOBE_RADIUS` and `latLonToVector3` always come from `src/utils/geo.js` — never duplicate them
- Border layers use slight radius offsets above the globe surface to avoid z-fighting:
    - Base borders: `GLOBE_RADIUS + 0.001`
    - Hover highlight: `GLOBE_RADIUS + 0.002`
    - Active highlight: `GLOBE_RADIUS + 0.002`
- Raycasting for click/hover against the globe sphere, then point-in-polygon for country identification
- Drag-vs-click guard: store `mousedown` position; skip `click` if pointer moved > 5 px
- OrbitControls `autoRotate` drives the rotation; `toggleRotation()` flips the flag

### Styling

- Use Tailwind utility classes for **everything** — no custom CSS unless a utility literally cannot do it
- Dark theme: `bg-gray-950`, `bg-gray-900`, `text-white`, `text-gray-400` palette
- Accent colours: `blue-300` / `blue-400` for interactive elements, `yellow-300` for hover highlights, `cyan-300` for active/selected
- Transitions via Tailwind (`transition-transform duration-300 ease-in-out`)

---

## External APIs

- **REST Countries v3.1**: `https://restcountries.com/v3.1/`
    - All countries list: `/all?fields=name,cca2,latlng`
    - Country detail: `/alpha/{cca2}`
- **countries-and-timezones** npm package: IANA timezone names per country code (DST-correct, no manual offset math)
- No backend, no paid APIs, no auth

---

## Data shape — `useApi.js` return value (`countryData`)

> **Note:** This shape may change as features are added. Read `src/composables/useApi.js` for the authoritative current shape.

```js
{
  name: string,
  officialName: string,
  flag: string,          // SVG URL from API
  capital: string,
  region: string,
  subregion: string,
  population: number,
  area: number,
  languages: string,     // comma-joined
  currencies: string,    // comma-joined
  timezones: string[],   // raw array from API, e.g. ["UTC+01:00", "UTC+02:00"]
}
```

## Data shape — `useCountriesStore.js` entries

> **Note:** Read `src/composables/useCountriesStore.js` for the authoritative current shape.

```js
{ name: string, code: string /* alpha-2 */, lat: number, lon: number }
```

---

## Code quality rules

- **Small, focused functions** — if a function does two things, split it
- **Clear names** — prefer `confirmClickByCode` over `handleCode`, `latLonToVector3` over `toVec`
- **Comments only where the logic is non-obvious** — do not add JSDoc to every function
- **No defensive coding for impossible cases** — trust internal contracts; only validate at API/user-input boundaries
- **No speculative abstractions** — don't build helpers for hypothetical future use
- **No TypeScript** — plain JS with clear naming is sufficient
- **Avoid large classes** — composables + plain functions only

---

## Known gotchas (do not re-introduce these bugs)

- **Circular imports**: `GLOBE_RADIUS` and `latLonToVector3` must live in `utils/geo.js`, nowhere else
- **atan2 longitude bug**: `vector3ToLonLat` must normalize theta with `if (theta < 0) theta += 2 * Math.PI` to avoid eastern-hemisphere misidentification
- **Drag triggers selection**: always check `Math.hypot(dx, dy) > 5` before treating a `mouseup` as a click
- **App.vue import order**: all `import` statements must be grouped at the top of `<script setup>` — no executable code between imports
- **DST-incorrect times**: use `Intl.DateTimeFormat` with an IANA timezone name, never manual UTC-offset arithmetic

---

## Feature checklist (already implemented — do not regress)

- [x] 3D Earth with 8K texture, stars, ambient + directional lighting
- [x] Country borders via topojson (50m resolution)
- [x] Hover highlight (yellow) + active highlight (cyan) per country polygon
- [x] Point-in-polygon click detection on globe surface
- [x] REST Countries API sidebar: flag, capital, region, population, area, languages, currencies
- [x] Live local time per timezone, grouped by current time value, IANA-based, DST-correct
- [x] Search bar with live dropdown (~250 countries)
- [x] Camera fly-to animation on country select
- [x] Rotate/pause button
- [x] Real-time solar position (UTC-based declination + hour angle)
- [x] Drag-vs-click guard

---

## Personal Notes

You are my ruthless mentor and sparring partner. Your job is to find the truth and tell it to me straight. Hurt my feelings if needed.

Never agree with me just to be agreeable. If I'm wrong, say so directly. Find the weak spots and blind spots in my thinking. Point them out even if I didn't ask. No flattery. No "great question!". No softering the blow unnecessarily. If you're unsure about something, say you're unsure. Verify with research, and provide me with sources to your research. Push back hard. Make me defend my ideas or abandon bad ones. If I ever seem to want validation more than truth, call it out.
