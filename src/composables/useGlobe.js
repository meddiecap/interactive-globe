import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { useBorders } from './useBorders.js'
import { GLOBE_RADIUS } from '../utils/geo.js'

export { GLOBE_RADIUS }

export function useGlobe(container) {
  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  )
  camera.position.set(0, 0, 6)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  // Lighting
  scene.add(new THREE.AmbientLight(0x333344, 1.5))
  const sunLight = new THREE.DirectionalLight(0xffffff, 2)
  sunLight.position.set(5, 3, 5)
  scene.add(sunLight)

  // Stars particle system
  const starsPositions = new Float32Array(3000 * 3)
  for (let i = 0; i < starsPositions.length; i++) {
    starsPositions[i] = (Math.random() - 0.5) * 600
  }
  const starsGeometry = new THREE.BufferGeometry()
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3))
  scene.add(
    new THREE.Points(
      starsGeometry,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.4, sizeAttenuation: true })
    )
  )

  // Earth sphere — load texture, fall back to a blue Phong material
  const earthGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64)
  const earthMaterial = new THREE.MeshPhongMaterial({
    color: 0x1a3a6b,
    specular: 0x224488,
    shininess: 30,
  })
  const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial)
  scene.add(earthMesh)

  new THREE.TextureLoader().load(
    '/textures/8k_earth_daymap.jpg',
    (texture) => {
      earthMaterial.map = texture
      earthMaterial.color.set(0xffffff)
      earthMaterial.needsUpdate = true
    }
  )

  // Thin atmosphere glow
  const atmosphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(GLOBE_RADIUS + 0.06, 64, 64),
    new THREE.MeshPhongMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.08,
      side: THREE.FrontSide,
      depthWrite: false,
    })
  )
  scene.add(atmosphereMesh)

  // Orbit controls
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.minDistance = 3
  controls.maxDistance = 12
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.4

  // Resize handler
  function onResize() {
    camera.aspect = container.clientWidth / container.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.clientWidth, container.clientHeight)
  }
  window.addEventListener('resize', onResize)

  // Country borders overlay — returns { updateHover, confirmClick }
  const borders = useBorders(scene)

  // Animation loop
  let animFrameId
  function animate() {
    animFrameId = requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }
  animate()

  function dispose() {
    cancelAnimationFrame(animFrameId)
    window.removeEventListener('resize', onResize)
    controls.dispose()
    renderer.dispose()
    if (container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement)
    }
  }

  return { scene, camera, renderer, earthMesh, controls, borders, dispose }
}
