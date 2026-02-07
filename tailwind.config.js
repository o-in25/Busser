/** @type {import('tailwindcss').Config} */
import { fontFamily } from 'tailwindcss/defaultTheme';

export default {
	future: {
		hoverOnlyWhenSupported: true,
	},
	darkMode: ['class'],
	content: ['./src/**/*.{html,js,svelte,ts}'],
	safelist: ['dark'],
	theme: {
		container: {
			center: true,
			padding: '0.5rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors: {
				border: 'hsl(var(--border) / <alpha-value>)',
				input: 'hsl(var(--input) / <alpha-value>)',
				ring: 'hsl(var(--ring) / <alpha-value>)',
				background: 'hsl(var(--background) / <alpha-value>)',
				foreground: 'hsl(var(--foreground) / <alpha-value>)',
				primary: {
					DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
					foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
					50: '#fff1f4',
					100: '#ffe4e9',
					200: '#ffccd8',
					300: '#ffa2b9',
					400: '#fd6f94',
					500: '#f84e80',
					600: '#e5195f',
					700: '#c10f50',
					800: '#a20f4a',
					900: '#8a1145',
					950: '#4d0421',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
					foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
					50: '#f8f6fc',
					100: '#f2edfa',
					200: '#e6dff5',
					300: '#d3c4ee',
					400: '#bca3e2',
					500: '#a57dd5',
					600: '#9058c4',
					700: '#844eb3',
					800: '#6f4196',
					900: '#5c377b',
					950: '#3a2253',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
					foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
					foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
					foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
					foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
				},
				card: {
					DEFAULT: 'hsl(var(--card) / <alpha-value>)',
					foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
				},
			},
			backdropBlur: {
				'3xl': '64px',
			},
			backdropSaturate: {
				125: '1.25',
				175: '1.75',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			fontFamily: {
				sans: ['Inter', ...fontFamily.sans],
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--bits-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--bits-accordion-content-height)' },
					to: { height: '0' },
				},
				'slide-in-from-left': {
					from: { transform: 'translateX(-100%)' },
					to: { transform: 'translateX(0)' },
				},
				'slide-out-to-left': {
					from: { transform: 'translateX(0)' },
					to: { transform: 'translateX(-100%)' },
				},
				'slide-in-from-right': {
					from: { transform: 'translateX(100%)' },
					to: { transform: 'translateX(0)' },
				},
				'slide-out-to-right': {
					from: { transform: 'translateX(0)' },
					to: { transform: 'translateX(100%)' },
				},
				'slide-in-from-top': {
					from: { transform: 'translateY(-100%)' },
					to: { transform: 'translateY(0)' },
				},
				'slide-out-to-top': {
					from: { transform: 'translateY(0)' },
					to: { transform: 'translateY(-100%)' },
				},
				'slide-in-from-bottom': {
					from: { transform: 'translateY(100%)' },
					to: { transform: 'translateY(0)' },
				},
				'slide-out-to-bottom': {
					from: { transform: 'translateY(0)' },
					to: { transform: 'translateY(100%)' },
				},
				'fade-in': {
					from: { opacity: '0' },
					to: { opacity: '1' },
				},
				'fade-out': {
					from: { opacity: '1' },
					to: { opacity: '0' },
				},
				'zoom-in': {
					from: { transform: 'scale(0.95)', opacity: '0' },
					to: { transform: 'scale(1)', opacity: '1' },
				},
				'zoom-out': {
					from: { transform: 'scale(1)', opacity: '1' },
					to: { transform: 'scale(0.95)', opacity: '0' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'slide-in-from-left': 'slide-in-from-left 0.2s ease-out',
				'slide-out-to-left': 'slide-out-to-left 0.15s ease-in',
				'slide-in-from-right': 'slide-in-from-right 0.2s ease-out',
				'slide-out-to-right': 'slide-out-to-right 0.15s ease-in',
				'slide-in-from-top': 'slide-in-from-top 0.2s ease-out',
				'slide-out-to-top': 'slide-out-to-top 0.15s ease-in',
				'slide-in-from-bottom': 'slide-in-from-bottom 0.2s ease-out',
				'slide-out-to-bottom': 'slide-out-to-bottom 0.15s ease-in',
				'fade-in': 'fade-in 0.15s ease-out',
				'fade-out': 'fade-out 0.1s ease-in',
				'zoom-in': 'zoom-in 0.2s ease-out',
				'zoom-out': 'zoom-out 0.2s ease-out',
			},
		},
	},
	plugins: [],
};
