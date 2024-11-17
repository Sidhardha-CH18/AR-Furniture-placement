import React, { useEffect, useState } from 'react';
// import { useRef } from "react";
import PropTypes from 'prop-types';
// import * as THREE from 'three';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import './../styles/BottomScreen.css';

function BottomScreen({ isVisible, model, onClose, onARViewClick }) {
  // const [isMounted, setIsMounted] = useState(false);
  // const canvasRef = useRef(null);
  // const sceneRef = useRef(null);
  // const rendererRef = useRef(null);

  // useEffect(() => {
  //   if (isVisible) {
  //     setIsMounted(true);  // Trigger the "visible" state
  //   } else {
  //     setTimeout(() => {
  //       setIsMounted(false);
  //     }, 300); // Matches the fade-out duration
  //   }
  // }, [isVisible]);

  // useEffect(() => {
  //   if (isMounted && model && model.glb) {
  //     // Initialize the 3D scene only if the model is mounted and the .glb file is available
  //     const canvas = canvasRef.current;
  //     const scene = new THREE.Scene();
  //     sceneRef.current = scene;

  //     // Create the camera
  //     const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  //     camera.position.set(0, 0, 5); // Adjust camera position for better view

  //     // Create the renderer and set its size
  //     const renderer = new THREE.WebGLRenderer({ canvas });
  //     renderer.setSize(canvas.clientWidth, canvas.clientHeight); // Ensure renderer size matches canvas
  //     renderer.setClearColor(0xffffff, 1); // Set background color to light gray
  //     rendererRef.current = renderer;

  //     // Load the model
  //     const loader = new GLTFLoader();
  //     loader.load(model.glb, (gltf) => {
  //       const loadedModel = gltf.scene;
  //       scene.add(loadedModel);

  //       // Center the model and scale it to fit within the camera's view
  //       loadedModel.position.set(0, 100, 0); // Center the model
  //       loadedModel.scale.set(4,4,4); // Scale model down (50%)

  //       // Add lighting to the scene
  //       const ambientLight = new THREE.AmbientLight(0x404040); // Ambient light
  //       scene.add(ambientLight);

  //       const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Directional light
  //       directionalLight.position.set(0, 1, 1).normalize();
  //       scene.add(directionalLight);
  //       camera.position.set(0,100, 10 );  // Move the camera back to fit the model

  //       // Animation loop
  //       const animate = () => {
  //         requestAnimationFrame(animate);

  //         // Rotate the model for better visualization
  //         loadedModel.rotation.y += 0.01;

  //         renderer.render(scene, camera); // Render the scene
  //       };

  //       animate(); // Start the animation loop
  //     }, undefined, (error) => {
  //       console.error('Error loading the .glb model', error);
  //     });

  //     return () => {
  //       // Cleanup on component unmount
  //       if (sceneRef.current) {
  //         sceneRef.current.clear(); // Clear the scene
  //       }

  //       if (rendererRef.current) {
  //         rendererRef.current.dispose(); // Dispose the renderer
  //       }
  //     };
  //   }
  // }, [isMounted, model]);

  // if (!isMounted) {
  //   return null;
  // }
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    if (isVisible) {
      setIsMounted(true);  // Trigger the "visible" state
    } else {
      setTimeout(() => {
        setIsMounted(false);
      }, 300); // Matches the fade-out duration
    }
  }, [isVisible]);

  if (!isMounted) {
    return null;
  }


  return (
    <div className={`bottom-screen ${isVisible ? 'visible' : ''}`}>
      {/* Overlay background */}
      <div className="bottom-screen-overlay" onClick={onClose} />

      <div className={`bottom-screen-content ${isVisible ? 'visible' : ''}`}>
        {/* Close button */}
        <button className="close-btn" onClick={onClose}>X</button>

        {/* Model Name */}
        {model && <h3 className="model-name">{model.name}</h3>}

        {/* 3D Model Viewer */}
        {/* <div className="model-viewer">
          <canvas ref={canvasRef} />
        </div> */}
        <div className="image-viewer">
          {model && model.image && (
            <img src={model.image} className='model-image' alt={model.name} />
          )}
        </div>

        {/* AR Button */}
        {model && <button className="action-btn" onClick={onARViewClick}>View in AR</button>}
      </div>
    </div>
  );
}

BottomScreen.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  model: PropTypes.shape({
    name: PropTypes.string.isRequired,
    image: PropTypes.string,
    glb: PropTypes.string.isRequired, // .glb file path is required
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onARViewClick: PropTypes.func.isRequired,  // Added AR view click handler prop
};

export default BottomScreen;
