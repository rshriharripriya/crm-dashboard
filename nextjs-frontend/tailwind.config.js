/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      boxShadow: {
        'glow-yellow': '0 0 6px 0 rgba(234, 179, 8, 0.3)',
        'glow-green': '0 0 6px 0 rgba(34, 197, 94, 0.3)',
        'glow-blue': '0 0 6px 0 rgba(59, 130, 246, 0.3)',
        'glow-red': '0 0 6px 0 rgba(239, 68, 68, 0.3)',
        'glow-purple': '0 0 6px 0 rgba(168, 85, 247, 0.3)',
        'glow-darkgreen': '0 0 6px 0 rgba(22, 101, 52, 0.3)'
      },
      backgroundColor: {
        'yellow-light': '#FFFBEB',
        'green-light': '#F0FDF4',
        'blue-light': '#EFF6FF',
        'red-light': '#FEF2F2',
        'purple-light': '#F5F3FF',
        'darkgreen-light': '#ECFDF5',
      },
      textColor: {
        'yellow-dark': '#92400E',
        'green-dark': '#166534',
        'blue-dark': '#1E40AF',
        'red-dark': '#991B1B',
        'purple-dark': '#5B21B6',
        'darkgreen-dark': '#064E3B',
      },
      borderColor: {
        'yellow-border': '#FDE68A',
        'green-border': '#BBF7D0',
        'blue-border': '#BFDBFE',
        'red-border': '#FECACA',
        'purple-border': '#DDD6FE',
        'darkgreen-border': '#A7F3D0',
      },
      },
    },

  plugins: [require("tailwindcss-animate")],
};


