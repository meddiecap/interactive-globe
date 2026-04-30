import * as THREE from 'three'

export const GLOBE_RADIUS = 2

/** Convert geographic lat/lon to a THREE.Vector3 on a sphere of the given radius. */
export function latLonToVector3(lat, lon, radius = GLOBE_RADIUS) {
  const phi   = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  )
}
