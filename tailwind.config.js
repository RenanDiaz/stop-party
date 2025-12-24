/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#1a1a2e',
        'bg-secondary': '#16213e',
        'accent-primary': '#e94560',
        'accent-secondary': '#0f3460',
        'text-primary': '#ffffff',
        'text-secondary': '#a0a0a0',
        'success': '#4ade80',
        'error': '#f87171',
        'warning': '#fbbf24'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-light': 'bounce 1s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'pop': 'pop 0.3s ease-out'
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' }
        },
        pop: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      }
    }
  },
  plugins: []
};
