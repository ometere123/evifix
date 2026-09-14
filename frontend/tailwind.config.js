/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
          950: "#431407"
        },
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        ink: "#070a0f"
      },
      boxShadow: {
        ember: "0 0 50px rgba(249, 115, 22, 0.12)"
      }
    }
  },
  plugins: []
};
