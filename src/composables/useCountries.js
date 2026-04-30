import * as THREE from 'three'
import { GLOBE_RADIUS, latLonToVector3 } from '../utils/geo.js'
import countriesData from '../data/countries.json'

export { latLonToVector3 }

// Markers sit slightly above the globe surface
const MARKER_RADIUS = GLOBE_RADIUS + 0.055

const COLOR_DEFAULT = 0xff6600
const COLOR_HOVER   = 0xffdd00
const COLOR_ACTIVE  = 0x00ddff

export function useCountries(scene) {
  const sharedGeometry = new THREE.SphereGeometry(0.045, 10, 10)

  const markers = countriesData.map((country) => {
    const mesh = new THREE.Mesh(
      sharedGeometry,
      new THREE.MeshBasicMaterial({ color: COLOR_DEFAULT })
    )
    mesh.position.copy(latLonToVector3(country.lat, country.lon, MARKER_RADIUS))
    mesh.userData = { country }
    scene.add(mesh)
    return mesh
  })

  let hoveredMarker = null
  let activeMarker  = null

  function resetMarker(mesh) {
    if (!mesh) return
    const isActive = mesh === activeMarker
    mesh.material.color.set(isActive ? COLOR_ACTIVE : COLOR_DEFAULT)
    mesh.scale.setScalar(1)
  }

  /** Call every mousemove — updates hover visuals and returns the hovered country or null. */
  function updateHover(raycaster) {
    resetMarker(hoveredMarker)
    hoveredMarker = null

    const [hit] = raycaster.intersectObjects(markers)
    if (hit) {
      hoveredMarker = hit.object
      if (hoveredMarker !== activeMarker) {
        hoveredMarker.material.color.set(COLOR_HOVER)
        hoveredMarker.scale.setScalar(1.6)
      }
    }

    return hoveredMarker?.userData.country ?? null
  }

  /** Call on click — returns the clicked country or null. Also updates active marker. */
  function getClickedCountry(raycaster) {
    const [hit] = raycaster.intersectObjects(markers)
    if (!hit) return null

    resetMarker(activeMarker)
    activeMarker = hit.object
    activeMarker.material.color.set(COLOR_ACTIVE)
    activeMarker.scale.setScalar(1.8)

    return activeMarker.userData.country
  }

  return { markers, countriesData, updateHover, getClickedCountry }
}
