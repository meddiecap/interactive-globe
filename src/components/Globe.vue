<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { useGlobe } from '../composables/useGlobe.js'
import { latLonToVector3 } from '../composables/useCountries.js'
import { GLOBE_RADIUS } from '../utils/geo.js'
import { useCountriesStore } from '../composables/useCountriesStore.js'

const { countries: countriesData } = useCountriesStore()

const emit = defineEmits(['countrySelected', 'rotationStopped'])

const containerRef = ref(null)

let globe = null
let borders = null   // assigned after useGlobe returns (borders come from useGlobe internals)

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// Track mouse-down position to distinguish click from drag
let mouseDownX = 0
let mouseDownY = 0
const DRAG_THRESHOLD = 5 // pixels

function onMouseDown(event) {
    // Cancel any in-progress fly-to so the user's drag/zoom doesn't fight the animation.
    stopFlyTo()
    mouseDownX = event.clientX
    mouseDownY = event.clientY
}

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
        borders.updateHover(null, countriesData.value)
        return
    }
    const country = borders.updateHover(point, countriesData.value)
    containerRef.value.style.cursor = country ? 'pointer' : 'default'
}

function onClick(event) {
    // Ignore if the mouse moved enough to be a drag
    const dx = event.clientX - mouseDownX
    const dy = event.clientY - mouseDownY
    if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) return

    if (!globe || !borders) return
    getMouseNDC(event)
    raycaster.setFromCamera(mouse, globe.camera)
    const point = getGlobePoint()
    if (!point) return
    const country = borders.confirmClick(point, countriesData.value)
    if (country) {
        animateCameraTo(country)
        emit('countrySelected', country)
    }
}

// Holds a cancel callback while a fly-to animation is running; null when idle.
let cancelFlyTo = null

/** Stop an in-progress fly-to animation so user input takes over immediately. */
function stopFlyTo() {
    if (cancelFlyTo) {
        cancelFlyTo()
        cancelFlyTo = null
    }
}

/** Smoothly fly the camera toward the selected country. */
function animateCameraTo(country) {
    if (!country.lat && !country.lon) return
    const { camera, controls } = globe
    if (controls.autoRotate) {
        controls.autoRotate = false
        emit('rotationStopped')
    }

    // Cancel a previous fly-to in case the user clicks a second country mid-animation.
    stopFlyTo()

    // Preserve the current zoom level — only change the viewing direction.
    const currentDistance = camera.position.length()
    const target = latLonToVector3(country.lat, country.lon, currentDistance)
    const startPos = camera.position.clone()
    const start = performance.now()
    const duration = 1100
    // Flag checked every frame; flipped by stopFlyTo() to abort the loop.
    let cancelled = false
    cancelFlyTo = () => { cancelled = true }

    function step() {
        if (cancelled) return
        const t = Math.min((performance.now() - start) / duration, 1)
        const ease = 1 - Math.pow(1 - t, 3)
        camera.position.lerpVectors(startPos, target, ease)
        camera.lookAt(0, 0, 0)
        controls.target.set(0, 0, 0)
        controls.update()
        if (t < 1) requestAnimationFrame(step)
        else cancelFlyTo = null
    }
    step()
}

/** Exposed so App.vue can trigger focus from the search bar. */
function focusCountry(country) {
    borders?.confirmClickByCode(country.code)
    animateCameraTo(country)
    emit('countrySelected', country)
}

function toggleRotation() {
    globe?.toggleRotation()
}

defineExpose({ focusCountry, toggleRotation })

onMounted(() => {
    const result = useGlobe(containerRef.value)
    globe = result
    borders = result.borders
    containerRef.value.addEventListener('mousedown', onMouseDown)
    containerRef.value.addEventListener('mousemove', onMouseMove)
    containerRef.value.addEventListener('click', onClick)
    containerRef.value.addEventListener('wheel', stopFlyTo, { passive: true })
})

onUnmounted(() => {
    containerRef.value?.removeEventListener('mousedown', onMouseDown)
    containerRef.value?.removeEventListener('mousemove', onMouseMove)
    containerRef.value?.removeEventListener('click', onClick)
    containerRef.value?.removeEventListener('wheel', stopFlyTo)
    globe?.dispose()
})
</script>

<template>
    <div ref="containerRef" id="globe-container" class="w-full h-full" />
</template>
