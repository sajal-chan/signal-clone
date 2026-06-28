import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        signal: {
          bg: "#1b1c1f",
          sidebar: "#1e1f23",
          bubble: {
            outgoing: "#2c5f8a",
            incoming: "#2a2b2f",
          },
          accent: "#3a76c4",
          text: {
            primary: "#e9edef",
            secondary: "#8696a0",
          },
          divider: "#2a2b2f",
          input: "#2a2b2f",
          online: "#00a884",
        },
      },
    },
  },
  plugins: [],
};

export default config;
