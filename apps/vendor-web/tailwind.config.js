/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vendor: {
          navy: '#23438F',
          'navy-dark': '#1B3573',
          'navy-light': '#2E54AD',
          soft: '#EEF3FA',
          orange: '#F58220',
          'orange-dark': '#D96D12',
          'orange-light': '#F79A4A',
          bg: '#F7F8FA',
          card: '#FFFFFF',
          text: '#263247',
          muted: '#718096',
          border: '#E5E9F0',
          success: '#15966B',
          warning: '#E6A23C',
          error: '#DC4545',
        },
        brand: {
          blue: {
            50: '#EEF3FA',
            100: '#DCE6F5',
            200: '#B9CEEB',
            300: '#8FB0DF',
            400: '#5E8ACF',
            500: '#3566B8',
            600: '#23438F',
            700: '#1B3573',
            800: '#152A5C',
            900: '#102047',
            950: '#0B1633'
          },
          orange: {
            50: '#FFF4EB',
            100: '#FFE5CF',
            200: '#FFC899',
            300: '#FFA961',
            400: '#F58220',
            500: '#F58220',
            600: '#D96D12',
            700: '#B5570A',
            800: '#8F4308',
            900: '#6E3306',
            950: '#471F02'
          },
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 2px 0 rgba(38, 50, 71, 0.04)',
        'card-hover': '0 4px 12px -2px rgba(38, 50, 71, 0.08)'
      }
    },
  },
  plugins: [],
}
