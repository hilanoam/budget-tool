/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: { sans: ["Heebo", "system-ui", "Arial"] },
      boxShadow: {
        soft: "0 14px 40px rgba(2,6,23,.12)",
        lift: "0 20px 70px rgba(2,6,23,.18)",
      },
    },
  },
  plugins: [],
};
