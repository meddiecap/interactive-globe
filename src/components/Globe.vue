<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { useGlobe, GLOBE_RADIUS } from '../composables/useGlobe.js'
import { useCountries, latLonToVector3 } from '../composables/useCountries.js'

const emit = defineEmits(['countrySelected'])

const containerRef = ref(null)

// Kept as plain vars — not reactive; managed inside Three.js lifecycle
let globe     = null
let countries = null

const raycaster = new THREE.Raycaster()
const mouse     = new THREE.Vector2()

function getMouseNDC(event) {
  const rect = containerRef.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width)  *  2 - 1
  mouse.y = ((event.clientY - rect.top)  / rect.height) * -2 + 1
}

function onMouseMove(event) {
  getMouseNDC(event)
  raycaster.setFromCamera(mouse, globe.camera)
  const hovered = countries.updateHover(raycaster)
  containerRef.value.style.cursor = hovered ? 'pointer' : 'default'
}

function onClick(event) {
  getMouseNDC(event)
  raycaster.setFromCamera(mouse, globe.camera)
  const country = countries.getClickedCountry(raycaster)
  if (country) {
    animateCameraTo(country)
    emit('countrySelected', country)
  }
}

/** Smoothly fly the camera toward the selected country. */
function animateCameraTo(country) {
  const { camera, controls } = globe
  controls.autoRotate = false

  const target   = latLonToVector3(country.lat, country.lon, GLOBE_RADIUS * 2.2)
  const startPos = camera.position.clone()
  const start    = performance.now()
  const duration = 1100 // ms

  function step() {
    const t    = Math.min((performance.now() - start) / duration, 1)
    const ease = 1 - Math.pow(1 - t, 3) // cubic ease-out

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
  globe     = useGlobe(containerRef.value)
  countries = useCountries(globe.scene)

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
