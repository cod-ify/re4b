import React from 'react';

const Button = ({ children, variant = "primary", onClick, className = "", icon: Icon, disabled }) => {
  const baseStyle = "flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-500",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-500",
    outline: "border border-slate-300 text-slate-600 hover:bg-slate-50"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={18} className="mr-2" />}
      {children}
    </button>
  );
};

export default Button;