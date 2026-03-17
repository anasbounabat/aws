/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0F1C15',
          900: '#13231A',
          800: '#183024'
        },
        sand: {
          50: '#FBF8F1',
          100: '#F5F0E6',
          200: '#E9E0D0',
          300: '#DACDB6'
        },
        gold: {
          300: '#E6D39A',
          400: '#D7BD73'
        },
        leaf: {
          300: '#A6D6B8',
          400: '#73C593',
          500: '#3AA66F'
        }
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 28, 21, 0.18)',
        lift: '0 16px 50px rgba(15, 28, 21, 0.22)'
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem'
      }
    }
  }
}

