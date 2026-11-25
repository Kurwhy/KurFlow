import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './resources/views/**/*.blade.php',
        './resources/js/**/*.{ts,tsx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Inter Variable"', 'Inter', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                ink: '#0E0F11',
                surface: '#15161A',
                panel: '#17181C',
                card: '#1B1C21',
                hairline: '#26272D',
                'hairline-hover': '#3A3A40',
                paper: '#ECEAE4',
                muted: '#9A9890',
                faint: '#64635E',
                emerald: '#10B981',
                danger: '#E5484D',
                'danger-soft': '#FF8A8C',
                warning: '#F59E0B',
                gold: {
                    DEFAULT: '#D4AF37',
                    50: '#FBF6E6',
                    100: '#F5EBC4',
                    200: '#EBD88E',
                    300: '#E0C55C',
                    400: '#D4AF37',
                    500: '#B8962B',
                    600: '#957922',
                    700: '#715C1A',
                    800: '#4D3F12',
                    900: '#2B230A',
                },
                tag: {
                    red: '#E5484D',
                    orange: '#F59E0B',
                    gold: '#D4AF37',
                    green: '#10B981',
                    blue: '#3E9BD6',
                    lavender: '#A07CDB',
                },
            },
            borderRadius: {
                btn: '6px',
                card: '8px',
                column: '10px',
                panel: '12px',
            },
            boxShadow: {
                drag: '0 8px 24px rgba(0,0,0,0.45)',
                drawer: '-12px 0 32px rgba(0,0,0,0.4)',
                panel: '0 16px 40px rgba(0,0,0,0.45)',
            },
            transitionTimingFunction: {
                dnd: 'cubic-bezier(0.2, 0, 0, 1)',
            },
            keyframes: {
                'toast-in': {
                    from: { opacity: '0', transform: 'translateY(-6px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
            },
            animation: {
                'toast-in': 'toast-in 160ms cubic-bezier(0.2, 0, 0, 1)',
            },
        },
    },
    plugins: [],
};
