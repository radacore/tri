/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,ts,tsx}'],
  theme: {
    extend: {
      colors: { primary: '#0158FE', 'primary-hover': '#2177FE', subtle: '#E2E7F9', dark: '#0A0A0A' },
      maxWidth: { content: '1200px' },
      fontFamily: {
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
      },
      borderRadius: { card: '20px', image: '16px' },
    },
  },
};
