/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
      './src/components/**/*.{js,ts,jsx,tsx,mdx}',
      './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {
        colors: {
          'background-dark': '#212121',
          'accent-green': '#8BAE92', // The grayish-green accent color from design
        },
        backgroundColor: {
          'gray-750': '#2D3748', // Slightly lighter than gray-800 for hover states
        }
      },
    },
    plugins: [],
  };