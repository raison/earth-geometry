import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "dat.gui";

let scene,
  camera,
  renderer,
  sphere,
  dodecahedron,
  dodecahedronGroup,
  controls,
  uniqueVertices,
  vertexData;

const vertexControllers = [];
function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const loader = new THREE.TextureLoader();

  // Load the world map texture
  loader.load("earth-lg.jpg", function (texture) {
    // Create the sphere (globe)
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);

    // Apply the texture to the sphere's material
    const sphereMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.5, // adjust this value as needed
    });
    sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);

    // Create a group
    dodecahedronGroup = new THREE.Group();

    // Dodecahedron solid faces
    const dodecahedronGeometry = new THREE.DodecahedronGeometry(1);
    const dodecahedronMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
    });
    dodecahedron = new THREE.Mesh(dodecahedronGeometry, dodecahedronMaterial);
    dodecahedronGroup.add(dodecahedron); // Add to the group instead of the scene

    // Dodecahedron edges
    const dodecahedronEdges = new THREE.EdgesGeometry(dodecahedronGeometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 }); // black color for the edges
    const lines = new THREE.LineSegments(dodecahedronEdges, edgeMaterial);
    dodecahedronGroup.add(lines); // Add to the group

    // Add the group to the scene
    scene.add(dodecahedronGroup);

    // Controls for orbiting
    controls = new OrbitControls(camera, renderer.domElement);

    // dat.GUI controls
    const gui = new GUI();
    const controlsObject = {
      size: 1,
      sphereOpacity: sphereMaterial.opacity,
    };

    gui.add(controlsObject, "size", 0.1, 5).name("Size").onChange(scaleObjects);
    gui
      .add(controlsObject, "sphereOpacity", 0, 1)
      .name("Globe Opacity")
      .onChange((opacity) => {
        sphereMaterial.opacity = opacity;
      });

    const dodecahedronFolder = gui.addFolder("Dodecahedron");
    dodecahedronFolder.open();
    dodecahedronFolder
      .add(dodecahedronGroup.rotation, "x", 0, Math.PI * 2)
      .name("Rotation X");
    dodecahedronFolder
      .add(dodecahedronGroup.rotation, "y", 0, Math.PI * 2)
      .name("Rotation Y");
    dodecahedronFolder
      .add(dodecahedronGroup.rotation, "z", 0, Math.PI * 2)
      .name("Rotation Z");
    console.log(
      "anything here?",
      dodecahedron.geometry.attributes.position.array
    );

    uniqueVertices = getUniqueVertices(dodecahedron.geometry);
    vertexData = {
      vertices: Array(uniqueVertices.length).fill({ lat: 0, lon: 0 }),
    };

    let folder = gui.addFolder("Vertices");
    folder.open();
    for (let i = 0; i < vertexData.vertices.length; i++) {
      let controller = folder.addFolder(`Vertex ${i + 1}`);
      controller.add(vertexData.vertices[i], "lat").step(0.001).listen();
      controller.add(vertexData.vertices[i], "lon").step(0.001).listen();
      controller.open()
      vertexControllers.push(controller);
    }

    console.log("are there controllers?", vertexControllers);
    window.addEventListener("resize", onWindowResize, false);
    animate();
  });
}

function scaleObjects(size) {
  sphere.scale.set(size, size, size);
  dodecahedronGroup.scale.set(size, size, size);
}

function animate() {
  requestAnimationFrame(animate);

  extractLatLngFromVertices(dodecahedron, uniqueVertices);

  for (let i = 0; i < vertexControllers.length; i++) {
    vertexControllers[i].__controllers[0].setValue(vertexData.vertices[i].lat || 0);
    vertexControllers[i].__controllers[1].setValue(vertexData.vertices[i].lon || 0);
  }

  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function extractLatLngFromVertices(dodecahedron, uniqueVertices) {
  for (let i = 0; i < uniqueVertices.length; i++) {
    const vertex = uniqueVertices[i]
      .clone()
      .applyMatrix4(dodecahedron.matrixWorld);

    const theta = Math.atan2(vertex.y, vertex.x);
    const phi = Math.acos(vertex.z / sphere.geometry.parameters.radius);

    const longitude = THREE.MathUtils.radToDeg(theta);
    const latitude = 90 - THREE.MathUtils.radToDeg(phi);

    vertexData.vertices[i] = {
      lat: Number(latitude.toFixed(2)),
      lon: Number(longitude.toFixed(2)),
    };
  }
}

function getUniqueVertices(geometry) {
  const uniqueVertices = [];
  const vertices = geometry.attributes.position.array;
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const y = vertices[i + 1];
    const z = vertices[i + 2];
    const vector = new THREE.Vector3(x, y, z);
    let isDuplicate = false;
    for (let j = 0; j < uniqueVertices.length; j++) {
      if (vector.equals(uniqueVertices[j])) {
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) {
      uniqueVertices.push(vector);
    }
  }
  return uniqueVertices;
}

init();
