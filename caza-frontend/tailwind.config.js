/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#6C63FF',
          secondary: '#FF6584',
          accent: '#43E97B',
        },
        dark: {
          bg: '#0D0D1A',
          card: '#12122A',
          elevated: '#1A1A3E',
          border: 'rgba(255,255,255,0.08)',
        },
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        sans: ['Outfit', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6C63FF 0%, #FF6584 100%)',
        'gradient-green': 'linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0D0D1A 0%, #1A1A3E 100%)',
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-out',
        'slideUp': 'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-light': 'bounce 1s infinite',
        'wave': 'wave 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(108, 99, 255, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(108, 99, 255, 0.8), 0 0 40px rgba(108, 99, 255, 0.3)' },
        },
        wave: {
          '0%, 100%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(0.3)' },
        },
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(108, 99, 255, 0.4)',
        'glow-pink': '0 0 20px rgba(255, 101, 132, 0.4)',
        'glow-green': '0 0 20px rgba(67, 233, 123, 0.4)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      backdropBlur: {
        'xs': '4px',
      },
    },
  },
  plugins: [],
}
