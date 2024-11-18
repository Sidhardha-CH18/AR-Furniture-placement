import "./App.css";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { XREstimatedLight } from "three/examples/jsm/webxr/XREstimatedLight";
import { useLocation } from 'react-router-dom';
function App() {
  const location = useLocation();
  const { ms } = location.state || {};
  const modelPath = ms.glb;
  const modelScaleFactor = ms.target;
  let reticle;
  let hitTestSource = null;
  let hitTestSourceRequested = false;
  let scene, camera, renderer;
  let model;
  init();
  animate();
  function init() {
    let myCanvas = document.getElementById("canvas");
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, myCanvas.innerWidth / myCanvas.innerHeight, 0.01, 20);
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);
    renderer = new THREE.WebGLRenderer({canvas: myCanvas,antialias: true,alpha: true,});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(myCanvas.innerWidth, myCanvas.innerHeight);
    renderer.xr.enabled = true;
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
    });
    let arButton = ARButton.createButton(renderer, {requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay", "light-estimation"],domOverlay: { root: document.body },
    });
    arButton.style.bottom = "20%";
    document.body.appendChild(arButton);
    const loader = new GLTFLoader();
    loader.load(modelPath, function (glb) {
      model = glb.scene;
    });
    const controller = renderer.xr.getController(0);
    controller.addEventListener("select", onSelect);
    scene.add(controller);
    reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial()
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
  }
  function onSelect() {
    if (reticle.visible) {
      let newModel = model.clone();
      newModel.visible = true;
      reticle.matrix.decompose(newModel.position,newModel.quaternion,newModel.scale);
      newModel.scale.set(modelScaleFactor, modelScaleFactor, modelScaleFactor);
      scene.add(newModel);
    }
  }
  function animate() {
    renderer.setAnimationLoop(render);
  }
  function render(timestamp, frame) {
    if (frame) {
      const referenceSpace = renderer.xr.getReferenceSpace();
      const session = renderer.xr.getSession();
      if (!hitTestSourceRequested) {
        session.requestReferenceSpace("viewer").then(function (referenceSpace) {
          session.requestHitTestSource({ space: referenceSpace })
            .then(function (source) {
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
  return <div className="App"></div>;
}
export default App;
