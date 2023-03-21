/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            keyframes: {
                wiggle: {
                    '100%': { width: "200px" },
                    '0%': { width: "100px" },
                },
                grow: {
                    '100%': { transform: "scale(50000%)" },
                    '0%': { transform: "scale(100%)" },
                }
            },
            animation: {
                wiggle: 'wiggle 0.5s ease-in-out',
                grow: "grow 0.5s ease-in-out",
            }
        },
    },
}
