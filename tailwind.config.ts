import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-playfair)', 'serif'],
        sans: ['var(--font-lato)', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f4f8',
          100: '#dbe4ee',
          200: '#bcccdb',
          300: '#90acc2',
          400: '#628ba7',
          500: '#426d8c',
          600: '#325673',
          700: '#29465e', // Deep Navy - Main Trust Color
          800: '#243b4e',
          900: '#213241',
          950: '#141f29',
        },
        gold: {
          50: '#fbf9f1',
          100: '#f5f0dc',
          200: '#ebdcae',
          300: '#dec07a',
          400: '#d2a64e',
          500: '#ca8e35', // Bronze/Gold Main
          600: '#af702a',
          700: '#8c5224',
          800: '#744223',
          900: '#613821',
          950: '#381d0f',
        },
        cream: {
          50: '#fcfbf9',
          100: '#f6f3ef', // Soft background
          200: '#ebe3da',
        }
      },
    },
  },
  plugins: [],
}
export default config
