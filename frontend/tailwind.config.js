/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gemini: {
          bg: '#131314',
          surface: '#1e1f20',
          elevated: '#282a2c',
          sidebar: '#1e1f20',
          border: 'rgba(255, 255, 255, 0.08)',
          borderSubtle: '#3c4043',
          text: '#e3e3e3',
          textMuted: '#9aa0a6',
          textDim: '#5f6368',
          blue: '#8ab4f8',
          purple: '#c58af9',
          amber: '#fdd663',
          red: '#f28b82',
          green: '#81c995',
        },
        light: {
          bg: '#ffffff',
          surface: '#f0f4f9',
          elevated: '#e9eef6',
          border: '#dadce0',
          text: '#1f1f1f',
          textMuted: '#444746',
          textDim: '#747775',
          blue: '#1a73e8',
        }
      },
      fontFamily: {
        sans: ['Google Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'shimmer': 'shimmer 2.5s infinite linear',
        'pulse-subtle': 'pulseSubtle 2s infinite ease-in-out',
        'fadeIn': 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
