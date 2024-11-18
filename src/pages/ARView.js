import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import './../styles/ARView.css';
import { XREstimatedLight } from "three/examples/jsm/webxr/XREstimatedLight";
import { useLocation } from 'react-router-dom';

function ARView() {
  const location = useLocation();  // Access the current location object
  const { ms } = location.state || {};
  const modelPath = ms.glb;
  const modelScaleFactor = ms.target;

  let reticle;
  let hitTestSource = null;
  let hitTestSourceRequested = false;

  let scene, camera, renderer;
  let model;
  let models = [];
  let controller;

  let selectedModel = null; // Selected model reference
  let modelPlaced = false; // Flag for placement status

  let light, directionalLight;
  let xrLight;

  let previousTouch = null; // For tracking the touch movement
  let touchStartTime = 0;  // For tracking long press duration
  let touchDurationThreshold = 1000;  // 1 second threshold for long press

  init();
  animate();

  function init() {
    let myCanvas = document.getElementById("canvas");
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      70,
      myCanvas.innerWidth / myCanvas.innerHeight,
      0.01,
      20
    );

    light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    light.castShadow = true;
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5); 
    scene.add(ambientLight);

    directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(3, 5, -3);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    renderer = new THREE.WebGLRenderer({
      canvas: myCanvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(myCanvas.innerWidth, myCanvas.innerHeight);
    renderer.xr.enabled = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    xrLight = new XREstimatedLight(renderer);
    xrLight.addEventListener("estimationstart", () => {
      scene.add(xrLight);
      scene.remove(light);
      if (xrLight.environment) {
        scene.environment = xrLight.environment;
        adjustLightingBasedOnEstimation();
      }
    });

    xrLight.addEventListener("estimationend", () => {
      scene.add(light);
      scene.remove(xrLight);
      scene.environment = null;
    });

    let arButton = ARButton.createButton(renderer, {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay", "light-estimation"],
      domOverlay: { root: document.body },
    });
    arButton.style.bottom = "20%";
    document.body.appendChild(arButton);

    const loader = new GLTFLoader();
    loader.load(modelPath, function (glb) {
      model = glb.scene;
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true; 
          child.receiveShadow = true;
        }
      });
    }, undefined, function (error) {
      console.error(`Error loading model ${modelPath}:`, error);
    });

    controller = renderer.xr.getController(0);
    controller.addEventListener("select", onSelect);
    controller.addEventListener("selectstart", onSelectStart);
    scene.add(controller);

    reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial()
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.ShadowMaterial({ opacity: 0.5 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.1;
    floor.receiveShadow = true;
    scene.add(floor);

    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
  }

  function adjustLightingBasedOnEstimation() {
    if(xrLight.environment){
      const estimatedIntensity = xrLight.environment.intensity || 1.0;
      directionalLight.intensity = estimatedIntensity;
      const estimatedDirection = xrLight.environment.direction;
      directionalLight.position.set(estimatedDirection.x, estimatedDirection.y, estimatedDirection.z);
      const estimatedColorTemperature = xrLight.environment.colorTemperature || 6500;
      directionalLight.color.setHSL(estimatedColorTemperature / 10000, 0.5, 0.5);
    }
  }

  function onSelectStart(event) {
    const intersection = getIntersection(event.data.controller);
    if (selectedModel) {
      selectedModel.material.emissive.set(0x000000); // Deselect the model
      selectedModel = null;
    } else {
      if (intersection) {
        selectedModel = intersection.object;
        selectedModel.material.emissive.set(0xff0000); // Highlight selected model
        console.log('Selected model:', selectedModel);
      } 
    }
  }

  function getIntersection(controller) {
    const raycaster = new THREE.Raycaster();
    raycaster.ray.origin.set(controller.position.x, controller.position.y, controller.position.z);
    raycaster.ray.direction.set(0, -1, 0); 
    const intersects = raycaster.intersectObjects(models);
    return intersects.length > 0 ? intersects[0] : null;
  }

  function onSelect() {
    if (reticle.visible && !modelPlaced) {
      const newModel = model.clone();
      newModel.visible = true;
      reticle.matrix.decompose(newModel.position, newModel.quaternion, newModel.scale);
      newModel.position.y -= 0.15;
      const box = new THREE.Box3().setFromObject(newModel);
      const maxDimension = Math.max(box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z);
      let scaleFactor = modelScaleFactor < 1 ? modelScaleFactor : modelScaleFactor / maxDimension;
      newModel.scale.set(scaleFactor, scaleFactor, scaleFactor);
      scene.add(newModel);
      models.push(newModel);
      selectedModel = newModel;
      modelPlaced = true;
      reticle.visible = false;
    }
  }

  function onTouchStart(event) {
    if (selectedModel) {
      // Check if the touch point intersects with the selected model
      const intersection = getIntersection(event.touches[0]);
      if (intersection && intersection.object === selectedModel) {
        // Only start long press detection if the model is touched
        touchStartTime = Date.now();  // Start counting time for long press
      } else {
        // If the touch is not on the selected model, cancel any long press detection
        touchStartTime = 0;
      }
    }
    previousTouch = event.touches[0];  // Store the first touch position for movement tracking
  }

  function onTouchMove(event) {
    // If rotating the model with a single finger (no significant touch movement)
    if (selectedModel && event.touches.length === 1 && previousTouch) {
      const currentTouch = event.touches[0];
      const deltaX = currentTouch.clientX - previousTouch.clientX;  // Measure movement on X-axis
      selectedModel.rotation.y += deltaX * 0.005;  // Rotate model based on horizontal drag
      previousTouch = currentTouch;  // Update previous touch position
    }
  
    // Cancel long press detection if the touch moves too far (more than 10px)
    if (event.touches.length > 0 && 
        (Math.abs(event.touches[0].clientX - previousTouch.clientX) > 10 || 
         Math.abs(event.touches[0].clientY - previousTouch.clientY) > 10)) {
      touchStartTime = 0;  // Reset long press detection if moved too far
    }
  }

  function onTouchEnd(event) {
    // Only check for long press if it was on the selected model and the touch duration is sufficient
    if (selectedModel && touchStartTime > 0 && Date.now() - touchStartTime >= touchDurationThreshold) {
      removeModel();  // Call the function to remove the model
    }
    previousTouch = null;  // Reset touch tracking
  }

  function removeModel() {
    if (selectedModel) {
      scene.remove(selectedModel);  // Remove the model from the scene
      selectedModel.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose();  // Dispose of geometry to free up memory
          if (child.material.isMaterial) {
            child.material.dispose();  // Dispose of material to free up memory
          }
        }
      });
      selectedModel = null;  // Deselect the model
      console.log('Model removed from scene');
    }
  }
  
  function animate() {
    if (xrLight.environment) {
      adjustLightingBasedOnEstimation();
    }
    renderer.render(scene, camera);
    renderer.setAnimationLoop(render);
  }

  function render(timestamp, frame) {
    if (frame) {
      const referenceSpace = renderer.xr.getReferenceSpace();
      const session = renderer.xr.getSession();
      if (!hitTestSourceRequested) {
        session.requestReferenceSpace("viewer").then(function (referenceSpace) {
          session.requestHitTestSource({ space: referenceSpace }).then(function (source) {
            hitTestSource = source;
          });
        });
        hitTestSourceRequested = true;
      }
      if (hitTestSource) {
        const hitTestResults = frame.getHitTestResults(hitTestSource);
        if (hitTestResults.length) {
          const hit = hitTestResults[0];
          reticle.visible = true;
          reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
        } else {
          reticle.visible = false;
        }
      }
    }
    renderer.render(scene, camera);
  }

  return <div className="ARView"></div>;
}

export default ARView;
