import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";  // Import useNavigate
import BottomScreen from "../components/BottomScreen";
import Header from "../components/Header";
import './../styles/Home.css';

function Home() {
  
  const [isBottomScreenVisible, setBottomScreenVisible] = useState(false);
  const [models] = useState([
    { name: "Arm Chair", image: "/images/armchairk.png", glb: "/models/armchairk.glb", target:4 },
    { name: "Lounger", image: "/images/lounger.png", glb: "/models/lounger.glb", target:0.01 },
    { name: "Arm Chair Yellow", image: "/images/armchair.png", glb: "/models/armchair.glb", target: 0.01},
    { name: "Nested Table", image: "/images/nesttable.png", glb: "/models/nesttable.glb", target: 0.01 },
    { name: "Flip Table", image: "/images/fliptable.png", glb: "/models/filptable.glb", target: 0.01 },
    { name: "Arm Chair Large", image: "/images/armchairp.png", glb: "/models/armchairp.glb", target:1.6 },
    { name: "Dinning Table", image: "/images/dintable.png", glb: "/models/dintable.glb", target: 3 },
    { name: "Carpet", image: "/images/carpet.png", glb: "/models/carpet.glb", target: 3 },
    { name: "Side Board", image: "/images/sideboard.png", glb: "/models/sideboard.glb", target:3 },
    { name: "TV Stand", image: "/images/tvstand.png", glb: "/models/tvstand.glb", target: 3 },
    { name: "Coffee Set", image: "/images/coffeeset.png", glb: "/models/coffeeset.glb", target: 1.2},
    { name: "Coffee Table", image: "/images/coffeetable.png", glb: "/models/coffeetable.glb", target: 0.005 },
    { name: "Arm Chair violet", image: "/images/armchairv.png", glb: "/models/armchairv.glb", target: 0.01 },
    { name: "Couch", image: "/images/fcouch.png", glb: "/models/fcouch.glb", target:2.2 },
    { name: "Lamp", image: "/images/lamp.png", glb: "/models/lamp.glb", target: 5 },
    { name: "Round Table", image: "/images/rtable.png", glb: "/models/rtable.glb", target: 5 },
  ]);
  const [selectedModel, setSelectedModel] = useState(null);
  const navigate = useNavigate();  // Initialize navigate hook

  useEffect(() => {
    // Remove ARButton if it's in the DOM (using id selector)
    const arButton = document.getElementById("ARButton");
    if (arButton) {
      document.body.removeChild(arButton);
    }
  }, []);

  useEffect(() => {
    console.log("Selected Model: ", selectedModel);
    console.log("Is Bottom Screen Visible: ", isBottomScreenVisible);
  }, [selectedModel, isBottomScreenVisible]);

  const handleCardClick = (model) => {
    setSelectedModel(model);
    setBottomScreenVisible(true); // Show the bottom screen
  };

  // Navigate to ARView page
  const handleARViewClick = () => {
    
    navigate("/home/ARView",{ state: { ms: selectedModel } });  // Navigate to ARView page
  };

  return (
    <>
    <Header />
    <div>
      <h3>Furniture Models</h3>
      <div className="model-grid">
        {models.map((model) => (
          <div
            key={model.name}
            className="model-card"
            onClick={() => handleCardClick(model)} // Call the handler to update state
          >
            <img src={model.image} alt={model.name} className="model-image" />
            <p className="model-name">{model.name}</p>
          </div>
        ))}
      </div>

      {/* Only render BottomScreen if a model is selected */}
      {selectedModel && (
        <BottomScreen
          isVisible={isBottomScreenVisible}
          model={selectedModel}  // model is guaranteed to be not null here
          onClose={() => setBottomScreenVisible(false)} // Close the bottom screen
          onARViewClick={handleARViewClick}  // Pass AR view click handler
        />
      )}
    </div></>
  );
}

export default Home;
