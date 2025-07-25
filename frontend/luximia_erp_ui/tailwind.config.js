/** @type {import('tailwindcss').Config} */
const config = {
    darkMode: "class",
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                'luximia-dark': 'rgb(var(--color-luximia-dark) / <alpha-value>)',
                'luximia-gold': 'rgb(var(--color-luximia-gold) / <alpha-value>)',
                'luximia-orange': 'rgb(var(--color-luximia-orange) / <alpha-value>)',
            },
        },
    },
    plugins: [],
};
export default config;