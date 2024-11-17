import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
// import Header from "./components/Header";
import Home from "./pages/Home";
import ARView from "./pages/ARView";  // Add this import
import "./styles/App.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home/ARView" element={<ARView />} />  {/* ARView route */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
