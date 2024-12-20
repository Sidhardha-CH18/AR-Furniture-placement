import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function BottomScreen({ isVisible, model, onClose, onARViewClick }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsMounted(true);  // Show the BottomScreen
    } else {
      setTimeout(() => {
        setIsMounted(false);  // Hide the BottomScreen after fade-out
      }, 300);
    }
  }, [isVisible]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className={`bottom-screen ${isVisible ? 'visible' : ''}`}>
      <div className="bottom-screen-overlay" onClick={onClose} />
      <div className={`bottom-screen-content ${isVisible ? 'visible' : ''}`}>
        <button className="close-btn" onClick={onClose}>X</button>

        {model && <h3 className="model-name">{model.name}</h3>}

        <div className="image-viewer">
          {model && model.image && <img src={model.image} className='model-image' alt={model.name} />}
        </div>

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
    glb: PropTypes.string.isRequired, 
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onARViewClick: PropTypes.func.isRequired,  
};

export default BottomScreen;
