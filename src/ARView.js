import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import './../styles/ARView.css';
import { XREstimatedLight } from "three/examples/jsm/webxr/XREstimatedLight";
import { useLocation } from 'react-router-dom';

function ARView() {
  const location = useLocation();
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

  let selectedModel = null;

  let modelPlaced = false;

  let light, directionalLight;
  let xrLight;

  let deleteButton;
  let rotateSliderY;
  let scaleSlider;
  init();
  animate();

  function init() {
    let myCanvas = document.getElementById("canvas");
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, myCanvas.innerWidth / myCanvas.innerHeight, 0.01, 20);

    light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(3, 5, -3);
    directionalLight.castShadow = true;
    directionalLight.shadow.bias = -0.03;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.intensity = 1.5;
    directionalLight.shadow.opacity = 0.6;

    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

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
    arButton.style.backgroundColor="blue"
    document.body.appendChild(arButton);

    const loader = new GLTFLoader();
    loader.load(modelPath, function (glb) {
      model = glb.scene;
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = false;
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

    deleteButton = document.createElement('button');
    deleteButton.innerText = 'Delete Model';
    deleteButton.className = 'delete-button';
    deleteButton.style.position = 'absolute';
    deleteButton.style.bottom = '10%';
    deleteButton.style.left = '50%';
    deleteButton.style.transform = 'translateX(-50%)';
    deleteButton.style.zIndex = '10';
    deleteButton.style.display = 'none';
    deleteButton.style.padding = '10px';
    deleteButton.style.border = '2px solid white';
    deleteButton.style.borderRadius = '10px';
    deleteButton.style.backgroundColor = 'transparent';
    deleteButton.style.color = 'white';
    deleteButton.style.fontWeight = 'bold';
    deleteButton.style.fontSize = '18px';
    deleteButton.addEventListener('click', deleteSelectedModel);
    document.body.appendChild(deleteButton);

    rotateSliderY = document.createElement('input');
    rotateSliderY.type = 'range';
    rotateSliderY.min = -180;
    rotateSliderY.max = 180;
    rotateSliderY.value = 0;
    rotateSliderY.style.position = 'absolute';
    rotateSliderY.style.zIndex = '10';
    rotateSliderY.style.left = '50%';
    rotateSliderY.style.bottom = '10%';
    rotateSliderY.style.transform = 'translateX(-50%)';
    rotateSliderY.style.display = 'none';  
    document.body.appendChild(rotateSliderY);

    scaleSlider = document.createElement('input');
    scaleSlider.type = 'range';
    scaleSlider.min = 0.1;  
    scaleSlider.max = 3;    
    scaleSlider.value = 1;  
    scaleSlider.style.position = 'absolute';
    scaleSlider.style.zIndex = '10';
    scaleSlider.style.left = '50%';
    scaleSlider.style.bottom = '20%';  
    scaleSlider.style.transform = 'translateX(-50%)';
    scaleSlider.style.display = 'none';  
    document.body.appendChild(scaleSlider);
  }

  function deleteSelectedModel() {
    if (selectedModel) {
      scene.remove(selectedModel);
      models = models.filter(model => model !== selectedModel);
      selectedModel = null;
      deleteButton.style.display = 'none';
    }
  }

  function adjustLightingBasedOnEstimation() {
    if (xrLight.environment) {
      const estimatedIntensity = xrLight.environment.intensity || 1.0;
      directionalLight.intensity = estimatedIntensity;

      const estimatedDirection = xrLight.environment.direction;
      directionalLight.position.set(estimatedDirection.x, estimatedDirection.y, estimatedDirection.z);

      const estimatedColorTemperature = xrLight.environment.colorTemperature || 6500;
      directionalLight.color.setHSL(estimatedColorTemperature / 10000, 0.5, 0.5);
    }
  }
  let isManipulationMode = false;

  function onSelectStart(event) {
    const intersection = getIntersection(event.data.controller);
    if (selectedModel) {
      selectedModel.material.emissive.set(0x000000);
      selectedModel = null;
      isManipulationMode = false;  
      rotateSliderY.style.display = 'none';  
      scaleSlider.style.display = 'none'; 
    } else {
      if (intersection) {
        selectedModel = intersection.object;
        selectedModel.material.emissive.set(0xff0000);
        deleteButton.style.display = 'block';
        isManipulationMode = true;
        rotateSliderY.style.display = 'block';  
        scaleSlider.style.display = 'block';  
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

      newModel.position.y -= 0.2;

      const box = new THREE.Box3().setFromObject(newModel);
      const modelWidth = box.max.x - box.min.x;
      const modelHeight = box.max.y - box.min.y;
      const modelDepth = box.max.z - box.min.z;

      const maxDimension = Math.max(modelWidth, modelHeight, modelDepth);
      let scaleFactor;
      if (modelScaleFactor < 1) {
        scaleFactor = modelScaleFactor;
      } else {
        scaleFactor = modelScaleFactor / (maxDimension);
      }

      newModel.scale.set(scaleFactor, scaleFactor, scaleFactor);

      scene.add(newModel);
      models.push(newModel);
      selectedModel = newModel;
      deleteButton.style.display = 'block';

      modelPlaced = true;
      reticle.visible = false;
    }
  }



  function animate() {
    if (xrLight.environment) {
      adjustLightingBasedOnEstimation();
    }
    if (selectedModel && isManipulationMode) {
      // Apply rotation based on the rotation slider
      const rotationY = rotateSliderY.value * (Math.PI / 180);  // Convert degrees to radians
      selectedModel.rotation.set(0, rotationY, 0);  // Only Y-axis rotation
  
      // Apply scaling based on the scale slider
      const scaleValue = scaleSlider.value;
      selectedModel.scale.set(scaleValue, scaleValue, scaleValue);  // Uniform scaling
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
        session.addEventListener("end", function () {
          hitTestSourceRequested = false;
          hitTestSource = null;
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
