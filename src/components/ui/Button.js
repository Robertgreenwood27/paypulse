// src/components/ui/Button.js
import React from 'react';

const Button = React.forwardRef(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyle = "inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150";

    const variantStyles = {
      primary: "bg-accent-green text-background-dark hover:bg-opacity-80 focus:ring-accent-green",
      secondary: "bg-gray-600 text-gray-100 hover:bg-gray-500 focus:ring-gray-500",
      danger: "bg-red-600 text-white hover:bg-red-500 focus:ring-red-500",
      ghost: "bg-transparent text-gray-300 hover:bg-gray-700 hover:text-white focus:ring-gray-500"
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };

    const combinedClassName = `${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${className || ''}`;

    return (
      <button ref={ref} className={combinedClassName} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;