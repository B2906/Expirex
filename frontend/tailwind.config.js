/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#102a43',
        slate: {
          850: '#172b4d',
        },
        accent: '#0f766e',
      },
    },
  },
  plugins: [],
}
