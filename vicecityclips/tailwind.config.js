/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Pastilles de statut
        attente: {
          fond: '#fff7ed',
          fondSombre: '#431407',
          texte: '#9a3412',
          texteSombre: '#fdba74',
          bord: '#fdba74',
        },
        approuve: {
          fond: '#ecfdf5',
          fondSombre: '#052e16',
          texte: '#047857',
          texteSombre: '#6ee7b7',
          bord: '#6ee7b7',
        },
        refuse: {
          fond: '#fef2f2',
          fondSombre: '#450a0a',
          texte: '#b91c1c',
          texteSombre: '#fca5a5',
          bord: '#fca5a5',
        },
        paye: {
          fond: '#d1fae5',
          fondSombre: '#064e3b',
          texte: '#065f46',
          texteSombre: '#a7f3d0',
          bord: '#34d399',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        carte: '0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04)',
      },
    },
  },
  plugins: [],
};
