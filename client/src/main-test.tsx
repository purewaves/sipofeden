import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Simple test component
function TestApp() {
  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>Sip of Eden - Test Page</h1>
      <p>If you can see this page, the basic configuration is working!</p>
      <button 
        style={{ 
          backgroundColor: "green", 
          color: "white", 
          padding: "10px 20px", 
          border: "none", 
          borderRadius: "4px", 
          cursor: "pointer",
          marginTop: "20px"
        }}
      >
        Test Button
      </button>
    </div>
  );
}

// Initialize root element and render the test app
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>
); 