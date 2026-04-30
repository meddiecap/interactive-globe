import * as THREE from 'three'
import * as topojson from 'topojson-client'
import worldData from 'world-atlas/countries-110m.json'
import { GLOBE_RADIUS, latLonToVector3 } from '../utils/geo.js'

// Borders sit just above the globe surface to avoid z-fighting
const BORDER_RADIUS = GLOBE_RADIUS + 0.008

export function useBorders(scene) {
  // topojson.mesh returns a MultiLineString of all country borders.
  // Passing the filter (a, b) => a !== b gives only shared borders (no coastlines).
  // Without the filter we get all outlines including coastlines — looks better on a globe.
  const mesh = topojson.mesh(worldData, worldData.objects.countries)

  const positions = []

  for (const line of mesh.coordinates) {
    for (let i = 0; i < line.length - 1; i++) {
      // GeoJSON coordinates are [longitude, latitude]
      const a = latLonToVector3(line[i][1],     line[i][0],     BORDER_RADIUS)
      const b = latLonToVector3(line[i + 1][1], line[i + 1][0], BORDER_RADIUS)
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

  const material = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.22,
  })

  const borders = new THREE.LineSegments(geometry, material)
  scene.add(borders)

  return { borders }
}
