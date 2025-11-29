import React from 'react';

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden dark:bg-slate-900 dark:border-slate-800 transition-colors duration-300 ${className}`}>
    {children}
  </div>
);

export default Card;