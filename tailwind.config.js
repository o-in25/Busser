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
				'glass-open': {
					'0%': {
						opacity: '0',
						transform: 'scale(0.85)',
						'backdrop-filter': 'blur(0px) saturate(1)',
					},
					'50%': {
						opacity: '1',
						transform: 'scale(1.02)',
						'backdrop-filter': 'blur(12px) saturate(1.3)',
					},
					'100%': {
						opacity: '1',
						transform: 'scale(1)',
						'backdrop-filter': 'blur(16px) saturate(1.5)',
					},
				},
				'glass-close': {
					'0%': {
						opacity: '1',
						transform: 'scale(1)',
						'backdrop-filter': 'blur(16px) saturate(1.5)',
					},
					'100%': {
						opacity: '0',
						transform: 'scale(0.9)',
						'backdrop-filter': 'blur(0px) saturate(1)',
					},
				},
				'glass-item': {
					'0%': { opacity: '0', transform: 'translateY(4px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
				'glass-shimmer': {
					'0%': { 'background-position': '-200% 0' },
					'100%': { 'background-position': '200% 0' },
				},
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
				// ios-style chat animations
				'chat-bubble': {
					'0%': { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
					'100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
				},
				'chat-card': {
					'0%': { opacity: '0', transform: 'translateY(20px) scale(0.96)' },
					'60%': { opacity: '1', transform: 'translateY(-2px) scale(1.005)' },
					'100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
				},
				'chat-fade-up': {
					'0%': { opacity: '0', transform: 'translateY(8px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
				'typing-dot': {
					'0%, 100%': { opacity: '0.25', transform: 'scale(0.85)' },
					'50%': { opacity: '0.8', transform: 'scale(1)' },
				},
			},
			animation: {
				'glass-open': 'glass-open 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
				'glass-close': 'glass-close 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
				'glass-item': 'glass-item 0.25s ease-out both',
				'glass-shimmer': 'glass-shimmer 1.5s ease-out',
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
				// ios-style chat animations (damped spring, no bounce)
				'chat-bubble': 'chat-bubble 0.35s cubic-bezier(0.2, 0.9, 0.3, 1) both',
				'chat-card': 'chat-card 0.45s cubic-bezier(0.2, 0.9, 0.3, 1) both',
				'chat-fade-up': 'chat-fade-up 0.4s cubic-bezier(0.2, 0.9, 0.3, 1) both',
				'typing-dot': 'typing-dot 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
			},
		},
	},
	plugins: [],
};
