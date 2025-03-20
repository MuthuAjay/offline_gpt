/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#90EF8E', // Lighter version
          DEFAULT: '#68E365', // Our main green color
          dark: '#58ce56', // Darker version
        },
        // Adding Neutrax colors
        neutrax: {
          green: '#8cc840',      // Main Neutrax green for avatar
          light: '#f6f9f1',      // Light mint for message backgrounds
          border: '#e5edd8',     // Subtle border color
          hover: '#e9f4d8',      // Hover state color
          accent: '#5a8428',     // Darker green for accents
        },
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        sidebar: {
          DEFAULT: '#111827',
          800: '#1F2937',
          700: '#374151',
          600: '#4B5563',
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      borderRadius: {
        'bubble': '1.5rem',
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out forwards',
        slideIn: 'slideIn 0.3s ease-out forwards',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.neutral.800'),
            a: {
              color: theme('colors.neutrax.green'),
              fontWeight: '500',
              textDecoration: 'none',
              transition: 'all 0.2s',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
            code: {
              color: theme('colors.neutrax.green'),
              backgroundColor: theme('colors.neutral.100'),
              borderRadius: theme('borderRadius.DEFAULT'),
              paddingLeft: theme('spacing[1.5]'),
              paddingRight: theme('spacing[1.5]'),
              paddingTop: theme('spacing[0.5]'),
              paddingBottom: theme('spacing[0.5]'),
              fontWeight: '400',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: theme('colors.neutral.100'),
              borderRadius: theme('borderRadius.lg'),
              padding: theme('spacing.4'),
              boxShadow: theme('boxShadow.sm'),
              border: `1px solid ${theme('colors.neutral.200')}`,
              overflowX: 'auto',
            },
            blockquote: {
              borderLeftColor: theme('colors.neutrax.green'),
              backgroundColor: theme('colors.neutrax.light'),
              borderRadius: `0 ${theme('borderRadius.lg')} ${theme('borderRadius.lg')} 0`,
              padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
              fontStyle: 'italic',
              color: theme('colors.neutral.700'),
            },
            h1: {
              color: theme('colors.neutral.900'),
              fontWeight: '600',
            },
            h2: {
              color: theme('colors.neutral.900'),
              fontWeight: '600',
            },
            h3: {
              color: theme('colors.neutral.900'),
              fontWeight: '600',
            },
            h4: {
              color: theme('colors.neutral.900'),
              fontWeight: '600',
            },
            'ul > li::before': {
              backgroundColor: theme('colors.neutrax.green'),
              width: '0.375em',
              height: '0.375em',
            },
            'ol > li::before': {
              color: theme('colors.neutrax.green'),
              fontWeight: '600',
            },
            hr: {
              borderColor: theme('colors.neutral.200'),
              marginTop: theme('spacing.6'),
              marginBottom: theme('spacing.6'),
            },
            table: {
              width: '100%',
              tableLayout: 'auto',
              textAlign: 'left',
              fontSize: theme('fontSize.sm')[0],
              borderCollapse: 'collapse',
            },
            thead: {
              borderBottomWidth: '2px',
              borderBottomColor: theme('colors.neutral.300'),
            },
            'thead th': {
              color: theme('colors.neutral.800'),
              fontWeight: '600',
              paddingTop: theme('spacing.3'),
              paddingBottom: theme('spacing.3'),
              paddingLeft: theme('spacing.4'),
              paddingRight: theme('spacing.4'),
            },
            'tbody tr': {
              borderBottomWidth: '1px',
              borderBottomColor: theme('colors.neutral.200'),
            },
            'tbody td': {
              paddingTop: theme('spacing.3'),
              paddingBottom: theme('spacing.3'),
              paddingLeft: theme('spacing.4'),
              paddingRight: theme('spacing.4'),
            },
          },
        },
      }),
      boxShadow: {
        'message': '0 2px 5px 0 rgba(0, 0, 0, 0.05)',
        'message-hover': '0 4px 12px 0 rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  darkMode: 'class',
}