/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      xs: '375px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        chattix: {
          // Professional messenger blue theme
          primary: '#4A90E2',        // Primary blue
          'primary-dark': '#357ABD', // Darker blue for hover
          'primary-light': '#5AA9FF', // Lighter blue for accents
          secondary: '#5AA9FF',      // Secondary blue
          accent: '#5AA9FF',         // Accent blue
          bg: '#F7FAFC',            // Light blue-gray background
          sidebar: '#FFFFFF',        // White sidebar
          chat: '#F7FAFC',          // Light chat background
          panel: '#F7FAFC',         // Panel background
          card: '#FFFFFF',          // White cards
          border: '#E2E8F0',        // Light borders
          text: '#1A202C',          // Dark text
          muted: '#718096',         // Muted text
          hover: '#F1F5F9',         // Hover state
        },
      },
      fontFamily: {
        sans: ['Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        'large': '0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};