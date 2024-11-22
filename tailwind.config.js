/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,jsx,ts,tsx}', // Cấu hình nội dung từ file thứ hai
    'app/**/*.{ts,tsx}', // Cấu hình nội dung từ file đầu tiên
    'components/**/*.{ts,tsx}', // Cấu hình nội dung từ file đầu tiên
  ],
  theme: {
    extend: {
      // Font Family từ file thứ hai
      fontFamily: {
        sans: ['Poppins', 'Montserrat', 'sans-serif'],
      },
      // Màu sắc từ cả hai file
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          light: '#6EE7B7',
          DEFAULT: '#34D399', // Tích hợp màu từ file thứ hai
          dark: '#059669',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          light: '#93C5FD',
          DEFAULT: '#3B82F6',
          dark: '#1D4ED8',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          light: '#FDE68A',
          DEFAULT: '#F59E0B',
          dark: '#B45309',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      // Border Radius từ file đầu tiên
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: 'calc(var(--radius) - 4px)',
      },
      // Keyframes từ file thứ hai
      keyframes: {
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
      // Animation từ file thứ hai
      animation: {
        'fade-in': 'fade-in 2s ease-in-out',
        'slide-up': 'slide-up 1s ease-in-out',
      },
      // Text Shadow từ file thứ hai
      textShadow: {
        blue: '0 0 10px rgba(0, 0, 255, 0.5)',
      },
    },
  },
  // Plugins từ cả hai file
  plugins: [
    require('tailwindcss-animate'), // Plugin từ cả hai file
    require('tailwindcss-textshadow'), // Plugin từ file thứ hai
  ],
};
