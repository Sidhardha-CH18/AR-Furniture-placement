// import "./App.css";
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
  const modelScaleFactor = 0.01;

  let reticle;
  let hitTestSource = null;
  let hitTestSourceRequested = false;

  let scene, camera, renderer;
  let model;
  let models=[];
  let controller;

  let selectedModel=null; //add-2
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

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);


    //add 
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 2, 3);
    directionalLight.castShadow = true;

    //add0.1
    directionalLight.shadow.bias = -0.01;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;


    scene.add(directionalLight);


    renderer = new THREE.WebGLRenderer({
      canvas: myCanvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(myCanvas.innerWidth, myCanvas.innerHeight);
    renderer.xr.enabled = true;

    //add
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;



    const xrLight = new XREstimatedLight(renderer);
    xrLight.addEventListener("estimationstart", () => {
      scene.add(xrLight);
      scene.remove(light);
      if (xrLight.environment) {
        scene.environment = xrLight.environment;
      }
    });

    xrLight.addEventListener("estimationend", () => {
      scene.add(light);
      scene.remove(xrLight);
      // scene.environment = null; // Reset environment
    });

    let arButton = ARButton.createButton(renderer, {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay", "light-estimation"],
      domOverlay: { root: document.body },
    });
    arButton.style.bottom = "20%";
    document.body.appendChild(arButton);

    // Load the single model
    const loader = new GLTFLoader();
    loader.load(modelPath, function (glb) {
      model = glb.scene;

      //add
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

    //add

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.ShadowMaterial({ opacity: 0.5 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.1;
    floor.receiveShadow = true;
    scene.add(floor);


    window.addEventListener('touchstart', (event) => onTouchStart(event));
    window.addEventListener('touchmove', (event) => onTouchMove(event));
    window.addEventListener('touchend', (event) => onTouchEnd(event));

  }
  

  //add-2

  function onSelectStart(event){
    if (selectedModel) {
      // Deselect the current model if any
      selectedModel.material.emissive.set(0x000000); // Reset highlight (e.g., remove color change)
      selectedModel = null;
    }
    const intersection = getIntersection(event.data.controller);
    if (intersection) {
      selectedModel = intersection.object;
      selectedModel.material.emissive.set(0xff0000); // Highlight selected model
      console.log('Selected model:', selectedModel);
    }
  }

  //add-2
  function getIntersection(controller) {
    const raycaster = new THREE.Raycaster();
    raycaster.ray.origin.set(controller.position.x, controller.position.y, controller.position.z);
    raycaster.ray.direction.set(0, -1, 0); // Raycasting downward

    const intersects = raycaster.intersectObjects(models);
    return intersects.length > 0 ? intersects[0] : null;
  }

  function onSelect() {

    if (reticle.visible ) {
      const newModel = model.clone();
      newModel.visible = true;

      // Set position and rotation
      reticle.matrix.decompose(
        newModel.position,
        newModel.quaternion,
        newModel.scale
      );

      //add
      // newModel.position.y -= 0.1;

      newModel.scale.set(modelScaleFactor, modelScaleFactor, modelScaleFactor);

      scene.add(newModel);

      //add-2
      models.push(newModel);
      selectedModel=newModel;

    }
  }

  //add-2
  let previousTouch=null;
  function onTouchMove(event) {
    if (selectedModel && previousTouch) {
      const currentTouch = event.touches[0];
      const deltaX = currentTouch.clientX - previousTouch.clientX;
      const deltaY = currentTouch.clientY - previousTouch.clientY;

      selectedModel.rotation.y += deltaX * 0.01;
      selectedModel.rotation.x += deltaY * 0.01;

      previousTouch = currentTouch;
    }
  }
  function onTouchStart(event) {
    if (selectedModel) {
      previousTouch = event.touches[0];
    }
  }

  function onTouchEnd(event) {
    previousTouch = null;
  }



  
  function animate() {
    renderer.setAnimationLoop(render);
  }

  function render(timestamp, frame) {
    if (frame) {
      const referenceSpace = renderer.xr.getReferenceSpace();
      const session = renderer.xr.getSession();

      if (hitTestSourceRequested===false) {
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
          reticle.matrix.fromArray(
            hit.getPose(referenceSpace).transform.matrix
          );
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