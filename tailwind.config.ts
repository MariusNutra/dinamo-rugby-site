import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts}",
  ],
  theme: {
    extend: {
      colors: {
        dinamo: {
          red: '#D0021B',
          dark: '#8B0000',
          blue: '#1a2744',
          light: '#FFF5F5',
        },
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          from: { transform: 'translateY(0)', opacity: '1' },
          to: { transform: 'translateY(100%)', opacity: '0' },
        },
        // Sageata care arata spre bara Safari, pe iPhone.
        bob: {
          '0%, 100%': { transform: 'translateY(0)', opacity: '1' },
          '50%': { transform: 'translateY(7px)', opacity: '0.55' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.4s ease-out',
        'slide-down': 'slide-down 0.3s ease-in forwards',
        bob: 'bob 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
