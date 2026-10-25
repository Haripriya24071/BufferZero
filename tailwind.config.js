/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bone: '#F5F2EB',
        'bone-dark': '#EAE5DB',
        ink: '#12151A',
        'acid-lime': '#CCFF00',
        tomato: '#FF3B30',
        navy: '#02167F',
      },
      fontFamily: {
        display: ['Archivo', '-apple-system', 'sans-serif'],
        body: ['Inter', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
