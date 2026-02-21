/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx,css}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        display: ['Pacifico', 'cursive']
      },
      padding: {
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)'
      },
      colors: {
        'brand-red': '#D64034',
        'brand-red-hover': '#c2382e',
        'brand-cream': '#FEFBF0',
        'brand-brown': '#5D4037',
        'ui-white': '#FFFFFF'
      },
      boxShadow: {
        soft: '0 4px 20px rgba(93, 64, 55, 0.08)',
        'soft-lg': '0 8px 30px rgba(93, 64, 55, 0.12)'
      },
      fontSize: {
        'touch': ['1.125rem', { lineHeight: '1.5' }],
        'big': ['1.5rem', { lineHeight: '1.4' }],
        'giant': ['2rem', { lineHeight: '1.3' }]
      }
    }
  },
  plugins: []
}
