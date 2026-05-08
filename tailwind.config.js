/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['DM Sans','system-ui','sans-serif'] },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.3s ease forwards',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from:{opacity:0,transform:'translateY(8px)'}, to:{opacity:1,transform:'translateY(0)'} },
        float: { '0%,100%':{transform:'translateY(0)'},'50%':{transform:'translateY(-6px)'} },
      }
    }
  },
  plugins: []
}
