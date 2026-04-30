<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { useGlobe } from '../composables/useGlobe.js'
import { latLonToVector3, countriesData } from '../composables/useCountries.js'
import { GLOBE_RADIUS } from '../utils/geo.js'

const emit = defineEmits(['countrySelected'])

const containerRef = ref(null)

let globe = null
let borders = null   // assigned after useGlobe returns (borders come from useGlobe internals)

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

function getMouseNDC(event) {
    const rect = containerRef.value.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = ((event.clientY - rect.top) / rect.height) * -2 + 1
}

/** Cast a ray against the earth sphere and return the hit point, or null. */
function getGlobePoint() {
    const hits = raycaster.intersectObject(globe.earthMesh)
    return hits.length ? hits[0].point : null
}

function onMouseMove(event) {
    if (!globe || !borders) return
    getMouseNDC(event)
    raycaster.setFromCamera(mouse, globe.camera)
    const point = getGlobePoint()
    if (!point) {
        containerRef.value.style.cursor = 'default'
        borders.updateHover(null, countriesData)
        return
    }
    const country = borders.updateHover(point, countriesData)
    containerRef.value.style.cursor = country ? 'pointer' : 'default'
}

function onClick(event) {
    if (!globe || !borders) return
    getMouseNDC(event)
    raycaster.setFromCamera(mouse, globe.camera)
    const point = getGlobePoint()
    if (!point) return
    const country = borders.confirmClick(point, countriesData)
    if (country) {
        animateCameraTo(country)
        emit('countrySelected', country)
    }
}

/** Smoothly fly the camera toward the selected country. */
function animateCameraTo(country) {
    if (!country.lat && !country.lon) return
    const { camera, controls } = globe
    controls.autoRotate = false

    const target = latLonToVector3(country.lat, country.lon, GLOBE_RADIUS * 2.2)
    const startPos = camera.position.clone()
    const start = performance.now()
    const duration = 1100

    function step() {
        const t = Math.min((performance.now() - start) / duration, 1)
        const ease = 1 - Math.pow(1 - t, 3)
        camera.position.lerpVectors(startPos, target, ease)
        camera.lookAt(0, 0, 0)
        controls.target.set(0, 0, 0)
        controls.update()
        if (t < 1) requestAnimationFrame(step)
    }
    step()
}

/** Exposed so App.vue can trigger focus from the search bar. */
function focusCountry(country) {
    animateCameraTo(country)
    emit('countrySelected', country)
}
defineExpose({ focusCountry })

onMounted(() => {
    const result = useGlobe(containerRef.value)
    globe = result
    borders = result.borders

    containerRef.value.addEventListener('mousemove', onMouseMove)
    containerRef.value.addEventListener('click', onClick)
})

onUnmounted(() => {
    containerRef.value?.removeEventListener('mousemove', onMouseMove)
    containerRef.value?.removeEventListener('click', onClick)
    globe?.dispose()
})
</script>

<template>
    <div ref="containerRef" id="globe-container" class="w-full h-full" />
</template>
