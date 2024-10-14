import * as THREE from 'three';
import { Boid } from './boids.ts'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils';

function getRandomColor() {
  return new THREE.Color(Math.random() * 0.5 + 0.5, Math.random() * 0.5, Math.random() * 0.5); // Adjusting to more specific color ranges
}

const renderer = new THREE.WebGLRenderer();
console.log(window.innerWidth, window.innerHeight);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(95, window.innerWidth / window.innerHeight, 1, 5000);
camera.position.set(0, 0, 200);
camera.lookAt(0, 0, 0);


const scene = new THREE.Scene();

const bodyGeometry = new THREE.SphereGeometry(1, 16, 16);
const tailGeometry = new THREE.ConeGeometry(0.8, 1, 16);

// Translate tail geometry
tailGeometry.translate(-0.75, 0, 0); // Position the tail behind the body
tailGeometry.rotateZ(Math.PI / 2); // Rotate to align with the body

// Merge geometries
const combinedGeometry = BufferGeometryUtils.mergeGeometries([bodyGeometry, tailGeometry]);

// Create material and mesh


let cubes = []
let boids = [];
const boid_count = 1000;
for (let i = 0; i < boid_count; i++) {

  const fishMaterial = new THREE.MeshBasicMaterial({ color: getRandomColor() }); // Yellow color
  const fishMesh = new THREE.Mesh(combinedGeometry, fishMaterial);
  cubes.push(fishMesh);
  const boid = new Boid(i);
  boids.push(boid)
}

cubes.forEach((cube) => {
  scene.add(cube);
})

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;

const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);


const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
scene.add(ambientLight);

function updateFishDirection(fish, boid) {
  let x = boid.velocity.vx;
  let y = boid.velocity.vy;
  let z = boid.velocity.vz;

  const velocity = new THREE.Vector3(x, y, x);
  const pos = fish.position.clone();
  fish.lookAt(pos.add(velocity));
}

function animate() {
  for (let i = 0; i < boid_count; i++) {
    let cube = cubes[i];
    let boid = boids[i];
    boid.boid_algo(boids);
    cube.position.x = boid.x;
    cube.position.y = boid.y;
    cube.position.z = boid.z;
    updateFishDirection(cube, boid);
  }


  renderer.render(scene, camera);

  controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true

}
renderer.setAnimationLoop(animate);
