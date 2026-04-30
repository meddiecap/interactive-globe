You are a senior JavaScript / Three.js developer.

Create a portfolio-quality proof-of-concept called:

Interactive Country Globe

The goal is to build a simple but impressive 3D globe where users can explore countries and view country information from external APIs.

Do NOT over-engineer. Focus on a clean MVP that works.

Tech requirements:

- Vue.js 3 (Composition API)
- Three.js
- Tailwind CSS v4
- Vite
- Use ES modules
- Keep files modular and readable

Project structure:

- index.html
- src/main.js (Vue app entry point)
- src/App.vue (root component, layout)
- src/components/Globe.vue (Three.js canvas + globe logic)
- src/components/Sidebar.vue (country detail panel)
- src/components/SearchBar.vue (country search input)
- src/components/Overlay.vue (instruction overlay)
- src/composables/useGlobe.js (Three.js / OrbitControls setup)
- src/composables/useCountries.js (marker data + raycasting)
- src/composables/useApi.js (REST Countries API calls)
- src/data/countries.json (local country list)
- src/assets/style.css (Tailwind base + any global overrides)

Core features:

1. Render a 3D Earth globe
    - Use Three.js
    - Add stars/background
    - Add basic lighting
    - Add orbit controls
    - Use an Earth texture if simple, otherwise create a blue sphere with subtle shading

2. Country markers
    - Load a small local JSON list of countries with:
        - name
        - ISO code
        - latitude
        - longitude
    - Add markers on the globe for at least 20 countries
    - Convert latitude/longitude to 3D coordinates on the sphere
    - Markers should sit slightly above the globe surface

3. Interaction
    - User can hover markers
    - Hover changes marker appearance
    - User can click a marker
    - Clicking opens a sidebar with country information
    - Camera should smoothly rotate / move toward the selected country

4. External API data
    - Use REST Countries API v3.1:
      https://restcountries.com/v3.1/alpha/{code}
    - Fetch country details by ISO code
    - Show:
        - country name
        - flag
        - capital
        - region
        - population
        - languages
        - currencies

5. Optional statistics
    - Add a placeholder function for World Bank API integration
    - Do not fully implement complex charts yet
    - Show a simple “coming next” section for GDP / population trends

6. UI
    - Build all UI with Vue 3 components and Tailwind CSS utility classes
    - Create a clean sidebar component (Sidebar.vue)
    - Show loading and error states inside the sidebar
    - Include a SearchBar.vue component to filter/select countries
    - Include an Overlay.vue component with instructions:
        - Drag to rotate
        - Scroll to zoom
        - Click a marker to explore
    - Use Vue reactive state (ref / computed) for sidebar open/close, selected country, and search filter
    - Do not use any custom CSS where Tailwind utilities suffice

7. Code quality
    - Keep functions and composables small and focused
    - Use clear names
    - Add comments only where useful
    - Prefer Vue composables (useXxx) over large classes
    - Use Vue Composition API; avoid the Options API
    - Do not use TypeScript for now

Implementation details:

- Use raycasting for marker clicks
- Use requestAnimationFrame loop
- Use OrbitControls from Three.js examples
- Use Tailwind CSS utility classes for the sidebar and layout
- Make the app responsive enough for desktop

Important constraints:

- This is a portfolio demo, not a production GIS tool
- Do not implement real country polygon selection yet
- Do not require paid APIs
- Do not require a backend
- Keep it runnable with:
  npm install
  npm run dev
- Vue and Tailwind must be set up via Vite plugins (no CDN)

Return:

1. package.json
2. index.html
3. all source files
4. brief instructions to run the project

Focus on making the result visually clear, interactive, and easy to extend later.
