import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";  // Import useNavigate
import BottomScreen from "../components/BottomScreen";
import Header from "../components/Header";
import './../styles/Home.css';

function Home() {
  
  const [isBottomScreenVisible, setBottomScreenVisible] = useState(false);
  const [models] = useState([
    { name: "armchair", image: "/images/armchair.png", glb: "/models/armchair.glb", target: 0.01},
    { name: "lounger", image: "/images/lounger.png", glb: "/models/lounger.glb", target:0.01 },
    { name: "coffeetable", image: "/images/coffeetable.png", glb: "/models/coffeetable.glb", target: 0.005 },
    { name: "nesttable", image: "/images/nesttable.png", glb: "/models/nesttable.glb", target: 0.01 },
    { name: "armchairv", image: "/images/armchairv.png", glb: "/models/armchairv.glb", target: 0.01 },
    { name: "fliptable", image: "/images/fliptable.png", glb: "/models/filptable.glb", target: 0.01 },
    { name: "armchairk", image: "/images/armchairk.png", glb: "/models/armchairk.glb", target:4 },
    { name: "armchairp", image: "/images/armchairp.png", glb: "/models/armchairp.glb", target:1.6 },
    { name: "carpet", image: "/images/carpet.png", glb: "/models/carpet.glb", target: 3 },
    { name: "coffee set", image: "/images/coffeeset.png", glb: "/models/coffeeset.glb", target: 1.2},
    { name: "dinning table", image: "/images/dintable.png", glb: "/models/dintable.glb", target: 3 },
    { name: "fcouch", image: "/images/fcouch.png", glb: "/models/fcouch.glb", target:2.2 },
    { name: "lamp", image: "/images/lamp.png", glb: "/models/lamp.glb", target: 5 },
    { name: "rtable", image: "/images/rtable.png", glb: "/models/rtable.glb", target: 5 },
    { name: "side board", image: "/images/sideboard.png", glb: "/models/sideboard.glb", target:3 },
    { name: "tv stand", image: "/images/tvstand.png", glb: "/models/tvstand.glb", target: 3 }
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
