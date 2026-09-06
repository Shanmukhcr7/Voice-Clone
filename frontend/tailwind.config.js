/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cinebg: '#08090D',
        cinesurface: '#11131A',
        cineborder: '#252833',
        cinetext: '#F5F5F7',
        cinemuted: '#9699A6',
        cineaccent: '#6366f1',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

