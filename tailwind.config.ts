import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        void: "#08070A",
        charcoal: "#121116",
        ash: "#1D1B22",
        mist: "#8B8894",
        bone: "#F3F1EC",
        gold: {
          DEFAULT: "#D9B25C",
          light: "#EFD79A",
          dim: "#8A712F"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"]
      },
      backgroundImage: {
        "radial-glow":
          "radial-gradient(circle at 50% 0%, rgba(217,178,92,0.16), transparent 60%)",
        "grain": "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.035%22/></svg>')"
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseGlow: {
          "0%,100%": { opacity: "0.55" },
          "50%": { opacity: "1" }
        },
        flicker: {
          "0%,19%,21%,23%,25%,54%,56%,100%": { opacity: "1" },
          "20%,24%,55%": { opacity: "0.4" }
        }
      },
      animation: {
        fadeUp: "fadeUp 0.9s cubic-bezier(.16,1,.3,1) both",
        pulseGlow: "pulseGlow 3.5s ease-in-out infinite",
        flicker: "flicker 6s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;
