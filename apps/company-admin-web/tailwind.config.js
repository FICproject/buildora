/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      xs: '375px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        brand: {
          primary: '#AE887B',
          'primary-hover': '#9B7467',
          'primary-active': '#896357',
          secondary: '#F0DED0',
          'secondary-soft': '#F9F2EC',
          tertiary: '#5E5946',
          'tertiary-hover': '#4C4838',
        },
        surface: {
          page: '#FAF7F4',
          card: '#FFFFFF',
          subtle: '#F7F1EB',
          border: '#E5DCD3',
        },
        ink: {
          primary: '#3D392C',
          heading: '#5E5946',
          secondary: '#6E6859',
          muted: '#8E8777',
        },
        status: {
          success: '#15966B',
          warning: '#C9821E',
          error: '#C94444',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(94, 89, 70, 0.06), 0 1px 2px rgba(94, 89, 70, 0.04)',
        elevated: '0 8px 24px rgba(94, 89, 70, 0.08)',
      },
    },
  },
  plugins: [],
};
