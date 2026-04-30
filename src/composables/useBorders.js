import * as THREE from 'three'
import * as topojson from 'topojson-client'
import worldData from 'world-atlas/countries-110m.json'
import { GLOBE_RADIUS, latLonToVector3 } from '../utils/geo.js'
import isoData from '../data/isoNumeric.js'

const BORDER_RADIUS    = GLOBE_RADIUS + 0.008
const HIGHLIGHT_RADIUS = GLOBE_RADIUS + 0.014

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/** Build LineSegments positions from a GeoJSON MultiLineString (topojson.mesh output). */
function multiLineStringToPositions(multiLineString, radius) {
  const positions = []
  for (const line of multiLineString.coordinates) {
    for (let i = 0; i < line.length - 1; i++) {
      const a = latLonToVector3(line[i][1],     line[i][0],     radius)
      const b = latLonToVector3(line[i + 1][1], line[i + 1][0], radius)
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z)
    }
  }
  return new Float32Array(positions)
}

/** Build LineSegments positions from a GeoJSON Polygon or MultiPolygon feature. */
function featureToPositions(feature, radius) {
  const geom = feature.geometry
  if (!geom) return new Float32Array(0)
  const polygons = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates
  const positions = []
  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (let i = 0; i < ring.length - 1; i++) {
        const a = latLonToVector3(ring[i][1],     ring[i][0],     radius)
        const b = latLonToVector3(ring[i + 1][1], ring[i + 1][0], radius)
        positions.push(a.x, a.y, a.z, b.x, b.y, b.z)
      }
    }
  }
  return new Float32Array(positions)
}

function makeLineSegments(positions, material) {
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return new THREE.LineSegments(geo, material)
}

// ---------------------------------------------------------------------------
// Point-in-polygon (ray casting, 2-D lon/lat space)
// ---------------------------------------------------------------------------

function pointInRing(lon, lat, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1]
    const xj = ring[j][0], yj = ring[j][1]
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

function pointInGeometry(lon, lat, geometry) {
  if (!geometry) return false
  if (geometry.type === 'Polygon') {
    return pointInRing(lon, lat, geometry.coordinates[0])
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((poly) => pointInRing(lon, lat, poly[0]))
  }
  return false
}

function vector3ToLonLat(v) {
  const lat = 90 - (Math.acos(Math.max(-1, Math.min(1, v.y / GLOBE_RADIUS))) * 180) / Math.PI
  const lon = ((Math.atan2(v.z, -v.x) * 180) / Math.PI) - 180
  return [lon, lat]
}

// ---------------------------------------------------------------------------
// Main composable
// ---------------------------------------------------------------------------

export function useBorders(scene) {
  const features = topojson.feature(worldData, worldData.objects.countries).features

  // --- Base layer: all borders as a single mesh ---
  const allBorders = topojson.mesh(worldData, worldData.objects.countries)
  const basePositions = multiLineStringToPositions(allBorders, BORDER_RADIUS)
  const baseMesh = makeLineSegments(
    basePositions,
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 })
  )
  scene.add(baseMesh)

  // --- Highlight materials ---
  const hoverMaterial = new THREE.LineBasicMaterial({
    color: 0xffdd00, transparent: true, opacity: 0.9,
  })
  const activeMaterial = new THREE.LineBasicMaterial({
    color: 0x00ddff, transparent: true, opacity: 1,
  })

  let hoverLines  = null
  let activeLines = null
  let hoveredId   = null
  let activeId    = null

  function buildHighlight(feature, material, radius) {
    const positions = featureToPositions(feature, radius)
    if (!positions.length) return null
    return makeLineSegments(positions, material)
  }

  function clearHover() {
    if (hoverLines) { scene.remove(hoverLines); hoverLines = null }
    hoveredId = null
  }

  function clearActive() {
    if (activeLines) { scene.remove(activeLines); activeLines = null }
    activeId = null
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  function updateHover(point3D, countriesData) {
    if (!point3D) { clearHover(); return null }
    const [lon, lat] = vector3ToLonLat(point3D)
    const feature = features.find((f) => pointInGeometry(lon, lat, f.geometry))

    if (!feature) { clearHover(); return null }
    if (feature.id === hoveredId) return getCountryByFeature(feature, countriesData)

    clearHover()
    hoveredId  = feature.id
    hoverLines = buildHighlight(feature, hoverMaterial, HIGHLIGHT_RADIUS)
    if (hoverLines) scene.add(hoverLines)

    return getCountryByFeature(feature, countriesData)
  }

  function confirmClick(point3D, countriesData) {
    if (!point3D) return null
    const [lon, lat] = vector3ToLonLat(point3D)
    const feature = features.find((f) => pointInGeometry(lon, lat, f.geometry))
    if (!feature) return null

    if (feature.id !== activeId) {
      clearActive()
      activeId    = feature.id
      activeLines = buildHighlight(feature, activeMaterial, HIGHLIGHT_RADIUS + 0.004)
      if (activeLines) scene.add(activeLines)
    }

    return getCountryByFeature(feature, countriesData)
  }

  return { updateHover, confirmClick }
}

// ---------------------------------------------------------------------------
// Match a TopoJSON feature (numeric id) to our countries.json (alpha-2)
// ---------------------------------------------------------------------------

function getCountryByFeature(feature, countriesData) {
  const numericId = String(feature.id).padStart(3, '0')
  const alpha2    = isoData[numericId]
  if (!alpha2) return { name: 'Unknown', code: numericId, lat: 0, lon: 0 }
  const found = countriesData.find((c) => c.code === alpha2)
  return found ?? { name: alpha2, code: alpha2, lat: 0, lon: 0 }
}
