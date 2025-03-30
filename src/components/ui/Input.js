// src/components/ui/Input.js
import React from 'react';

const Input = React.forwardRef(
  ({ className, type = 'text', error, ...props }, ref) => {
    const baseStyle = "block w-full rounded-md border-gray-600 bg-gray-700 p-3 text-white shadow-sm focus:border-accent-green focus:ring focus:ring-accent-green focus:ring-opacity-50 disabled:opacity-60";
    const errorStyle = error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-600 focus:border-accent-green focus:ring-accent-green";
    const combinedClassName = `${baseStyle} ${errorStyle} ${className || ''}`;

    return (
      <input
        ref={ref}
        type={type}
        className={combinedClassName}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
export default Input;

export const Label = ({ className, children, ...props }) => (
    <label className={`block text-sm font-medium text-gray-300 mb-1 ${className || ''}`} {...props}>
        {children}
    </label>
);