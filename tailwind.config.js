const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: colors.sky,
        error: colors.pink,
      },
      flex: {
        fill: '1 1 100%',
        lock: '0 0 auto',
      },
    },
  },
  plugins: [],
};
