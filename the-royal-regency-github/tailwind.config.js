/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        regency: {
          ivory: '#faf6f0',
          blush: '#f4c2c2',
          rose: '#d98a9e',
          gold: '#d4af37',
          champagne: '#f3d9a4',
          burgundy: '#5c162b',
          velvet: '#3b0d1c',
          twilight: '#120b1f',
          obsidian: '#0b0712',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Playfair Display"', 'Georgia', 'serif'],
        display: ['"Cinzel"', '"Playfair Display"', 'Georgia', 'serif'],
        script: ['"Great Vibes"', '"Brush Script MT"', 'cursive'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        gilded: '0 0 28px rgba(212, 175, 55, 0.25), inset 0 1px 0 rgba(255, 243, 209, 0.3)',
        royal: '0 20px 60px rgba(8, 3, 16, 0.65)',
      },
    },
  },
  plugins: [],
};
