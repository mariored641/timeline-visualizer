/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pastel-blue': '#74B9FF',
        'pastel-blue-light': '#A8D5FF',
        'pastel-pink': '#FFD6E8',
        'pastel-purple': '#D4B5FF',
        'pastel-green': '#A8E6CF',
        'pastel-yellow': '#FFE5B4',
        'pastel-orange': '#FFDAA8',
        'bg-main': '#FAFBFC',
        'gray-soft': '#E8ECEF',
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 2px 12px rgba(0, 0, 0, 0.08)',
        'soft-md': '0 4px 20px rgba(0, 0, 0, 0.12)',
        'soft-lg': '0 8px 32px rgba(0, 0, 0, 0.15)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
