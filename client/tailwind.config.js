/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dbe4ff',
          400: '#7c8fff',
          500: '#5b6bff',
          600: '#4450e6',
          700: '#3639b3',
        },
      },
    },
  },
  plugins: [],
}
