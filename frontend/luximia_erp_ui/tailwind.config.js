/** @type {import('tailwindcss').Config} */
const config = {
    darkMode: "class", // <-- Esta línea es crucial
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {},
    variants: {},
    plugins: []
};
export default config;