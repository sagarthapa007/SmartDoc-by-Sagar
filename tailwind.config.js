/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 500: '#6366f1', 600:'#4f46e5' },
        ok: '#10B981', warn: '#F59E0B', danger: '#EF4444'
      }
    }
  },
  plugins: []
}
