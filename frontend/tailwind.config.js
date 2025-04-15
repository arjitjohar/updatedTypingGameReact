/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./pages/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
      extend: {
        colors: {
          'tan': {
            '200': '#F0E68C', // Example beige color (you might need to adjust the hex code)
          },
          'brown': {
            '800': '#654321', // Example brown color (you might need to adjust the hex code)
          },
          // ... other color extensions
        },
      },
    },
    plugins: [],
  }