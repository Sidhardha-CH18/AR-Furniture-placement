import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomScreen from "../components/BottomScreen";
import Header from "../components/Header";

function Home() {
  const [isBottomScreenVisible, setBottomScreenVisible] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const navigate = useNavigate();

  const models = [
    { name: "Arm Chair", image: "/images/armchairk.png", glb: "/models/armchairk.glb" },
    { name: "Lounger", image: "/images/lounger.png", glb: "/models/lounger.glb" },
    // Add other models here...
  ];

  useEffect(() => {
    const arButton = document.getElementById("ARButton");
    if (arButton) document.body.removeChild(arButton);
  }, []);

  const handleCardClick = (model) => {
    setSelectedModel(model);
    setBottomScreenVisible(true);
  };

  const handleARViewClick = () => {
    navigate("/home/ARView", { state: { model: selectedModel } });
  };

  return (
    <>
      <Header />
      <h3>Furniture Models</h3>
      <div className="model-grid">
        {models.map((model) => (
          <div key={model.name} className="model-card" onClick={() => handleCardClick(model)}>
            <img src={model.image} alt={model.name} />
            <p>{model.name}</p>
          </div>
        ))}
      </div>

      {selectedModel && (
        <BottomScreen
          isVisible={isBottomScreenVisible}
          model={selectedModel}
          onClose={() => setBottomScreenVisible(false)}
          onARViewClick={handleARViewClick}
        />
      )}
    </>
  );
}

export default Home;
