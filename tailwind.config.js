const colors = require("tailwindcss/colors");

module.exports = {
    content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            height: {
                header: "3.5rem",
                footer: "2rem",
            },
            minHeight: theme => ({
                main: `calc(100vh - ${theme("height.header")} - ${theme("height.footer")})`,
                inner: `calc(100vh - ${theme("height.header")} - ${theme("height.footer")} - 4rem)`,
                48: "12rem",
            }),
            colors: {
                primary: colors.rose,
                secondary: colors.orange,
                neutral: colors.zinc,
            },
        },
    },
    variants: {
        extend: {
            opacity: ["group-hover"],
        },
    },
    plugins: [],
};
