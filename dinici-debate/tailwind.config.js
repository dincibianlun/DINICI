/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          400: '#818cf8', // indigo-400
          500: '#6366f1', // indigo-500
          600: '#4f46e5', // indigo-600
        },
        danger: {
          400: '#f87171', // red-400
          500: '#ef4444', // red-500
          600: '#dc2626', // red-600
        },
        success: {
          400: '#4ade80', // green-400
          500: '#22c55e', // green-500
          600: '#16a34a', // green-600
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate')
  ],
}