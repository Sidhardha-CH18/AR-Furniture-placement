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
  const modelScaleFactor = ms.target;

  let reticle;
  let hitTestSource = null;
  let hitTestSourceRequested = false;

  let scene, camera, renderer;
  let model;
  let models=[];
  let controller;

  let selectedModel=null; //add-2

  let modelPlaced = false; //add-3

  //add-3

  let light, directionalLight;
  let xrLight;



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
    scene.add(light);


    //add 
    directionalLight = new THREE.DirectionalLight(0xffffff, 1);
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

    //add-3
    xrLight=new XREstimatedLight(renderer);


    xrLight.addEventListener("estimationstart", () => {
      scene.add(xrLight);
      scene.remove(light);
      if (xrLight.environment) {
        scene.environment = xrLight.environment;

        //add-3
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
  




  //add-3

  function adjustLightingBasedOnEstimation() {
    if(xrLight.environment){
      const estimatedIntensity=xrLight.environment.intensity || 1.0;
      directionalLight.intensity = estimatedIntensity;

      const estimatedDirection = xrLight.environment.direction;
      directionalLight.position.set(estimatedDirection.x, estimatedDirection.y, estimatedDirection.z);
      
      const estimatedColorTemperature = xrLight.environment.colorTemperature || 6500; // Default: 6500K (white light)
     directionalLight.color.setHSL(estimatedColorTemperature / 10000, 0.5, 0.5); // Adjust color temperature
    }
  }


  //add-2

  function onSelectStart(event){
    const intersection = getIntersection(event.data.controller);
    if (selectedModel) {// && selectedModel===intersection.object
      // Deselect the current model if any
      selectedModel.material.emissive.set(0x000000); // Reset highlight (e.g., remove color change)
      selectedModel = null;
    }
    else{
      if (intersection) {
        selectedModel = intersection.object;
        selectedModel.material.emissive.set(0xff0000); // Highlight selected model
        console.log('Selected model:', selectedModel);
      } 
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

    if (reticle.visible && !modelPlaced ) {
      const newModel = model.clone();
      newModel.visible = true;

      // Set position and rotation
      reticle.matrix.decompose(
        newModel.position,
        newModel.quaternion,
        newModel.scale
      );

      //add-to-know
      newModel.position.y -= 0.15;

      //add-4
      const box = new THREE.Box3().setFromObject(newModel);
      const modelWidth = box.max.x - box.min.x;  // Width (X axis)
      const modelHeight = box.max.y - box.min.y; // Height (Y axis)
      const modelDepth = box.max.z - box.min.z; 
      // c

      const maxDimension = Math.max(modelWidth, modelHeight, modelDepth);
      let scaleFactor;
      if(modelScaleFactor<1){
        scaleFactor=modelScaleFactor;
      }
      else{
        scaleFactor = modelScaleFactor/ (maxDimension);
      }
      



      newModel.scale.set(scaleFactor, scaleFactor, scaleFactor);

      scene.add(newModel);

      //add-2
      models.push(newModel);
      selectedModel=newModel;


      //add-3
      modelPlaced=true;
      reticle.visible=false;

    }
  }

  //add-2
  let previousTouch=null;
  let previousTouchDistance=null;
  function onTouchMove(event) {
    //add-3
    if (selectedModel && event.touches.length === 1 && previousTouch) {
      // Rotate the object
      const currentTouch = event.touches[0];
      const deltaX = currentTouch.clientX - previousTouch.clientX;
      selectedModel.rotation.y += deltaX * 0.005; // Rotation sensitivity

      previousTouch = currentTouch;
    }

    //add-3

    if (selectedModel && event.touches.length === 2) {
      // Scaling: Calculate the change in pinch distance
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const currentTouchDistance = getDistance(touch1, touch2);



      //add-3
      const minScale = 0.1;
      const maxScale = 5.0;
      if (previousTouchDistance !== null) {
        const scaleChange = currentTouchDistance / previousTouchDistance;
        //add-3

        const smoothingFactor = 0.1; // Adjust this value as needed

        let newScale = selectedModel.scale.x * scaleChange * smoothingFactor;
        newScale = Math.min(Math.max(newScale, minScale), maxScale);
        selectedModel.scale.set(newScale,newScale,newScale);
      }

      previousTouchDistance = currentTouchDistance; // Update previous distance
    }

  }

  // //add-3
  // let touchStartTime = 0;
  // let touchDurationThreshold = 1000; 


  function onTouchStart(event) {
    if (selectedModel) {

      //add-3
      if (event.touches.length === 2) {
        // Store initial pinch distance for scaling
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        previousTouchDistance = getDistance(touch1, touch2);
      }

      previousTouch = event.touches[0];
    }
  }

  function onTouchEnd(event) {
    if (event.touches.length < 2) {
      previousTouchDistance = null; // Reset pinch distance when less than 2 fingers are used
    }
    previousTouch = null;
  }


  function getDistance(touch1, touch2) {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  function animate() {
    //add-3
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