/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Логотип
        'logo-bright': '#e50102',
        'logo-dark': '#9e0202',
        
        // Тёмная тема
        'bg-dark': '#05022a',
        'bg-gradient': '#0f2667',
        'card-dark': '#1b2a50',
        'text-dark': '#d4d8e8',
        'link-dark': '#6ea8ff',
        'accent-dark': '#ffb44c',
        
        // Светлая тема
        'bg-light': '#f4f6fa',
        'card-light': '#ffffff',
        'text-light': '#333333',
        'link-light': '#0f4cbd',
        'accent-light': '#ff8c00',
      },
    },
  },
  plugins: [],
}
