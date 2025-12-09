/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // 自定义深色主题色
                'dark': {
                    900: '#0a0a0f',
                    800: '#111118',
                    700: '#1a1a24',
                    600: '#252532',
                },
                'accent': {
                    primary: '#6366f1',
                    secondary: '#8b5cf6',
                    success: '#22c55e',
                    warning: '#f59e0b',
                    danger: '#ef4444',
                }
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(99, 102, 241, 0.5)' },
                    '100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.8)' },
                }
            }
        },
    },
    plugins: [],
}
