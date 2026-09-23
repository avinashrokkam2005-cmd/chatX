/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ChatX dark theme palette
        chatx: {
          bg: '#0a0a0f',
          surface: '#12121a',
          card: '#1a1a25',
          border: '#2a2a3a',
          hover: '#222233',
          text: '#e4e4ef',
          'text-secondary': '#8888a0',
          accent: '#3b82f6',
          'accent-hover': '#2563eb',
          success: '#22c55e',
          danger: '#ef4444',
          warning: '#f59e0b',
          'sent-bubble': '#3b82f6',
          'received-bubble': '#1e1e2e',
          online: '#22c55e',
          offline: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
