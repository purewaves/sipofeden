import React from "react";
import logoPng from "../../assets/logo.jpg";

const Logo = ({ size = "medium" }) => {
  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-24 h-24",
    large: "w-32 h-32"
  };

  return (
    <img 
      src={logoPng} 
      alt="Sip of Eden Logo" 
      className={`rounded-full ${sizeClasses[size] || sizeClasses.medium}`}
    />
  );
};

export default Logo;
