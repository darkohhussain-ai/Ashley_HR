import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-2xl p-6 shadow-sm transition-all duration-300 ${className}`}>
    {children}
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const base = "px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition active:scale-95 text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";
  
  let variantStyles = "";
  switch (variant) {
    case 'primary':
      variantStyles = "bg-[var(--brand-color)] text-white hover:opacity-90";
      break;
    case 'secondary':
      variantStyles = "bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600";
      break;
    case 'danger':
      variantStyles = "bg-red-500 text-white hover:bg-red-600";
      break;
    case 'success':
      variantStyles = "bg-green-600 text-white hover:bg-green-700";
      break;
  }

  return (
    <button className={`${base} ${variantStyles} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input 
    {...props} 
    className={`w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-dark-border rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)] transition text-sm ${props.className || ''}`}
  />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select 
    {...props}
    className={`w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-dark-border rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)] transition text-sm ${props.className || ''}`}
  >
    {props.children}
  </select>
);
