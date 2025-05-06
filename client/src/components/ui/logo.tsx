import React from "react";

// Use a relative path to the logo image
const logoUrl = "/assets/logo.jpg";

const Logo = ({ size = "medium" }: { size?: "small" | "medium" | "large" }) => {
  const sizeClasses = {
    small: "h-8",
    medium: "h-12",
    large: "h-16",
  };

  return (
    <img 
      src={logoUrl} 
      alt="Sip of Eden" 
      className={`${sizeClasses[size]} rounded-full`} 
    />
  );
};

export default Logo;
