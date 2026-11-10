/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      keyframes: {
        // GPU-friendly: translate3d forces a composited layer on all engines.
        // Never animate top/left/width/height here — that causes full repaints.
        float: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%':      { transform: 'translate3d(0, -24px, 0)' },
        },
        // Only applied to .grad (text-clipped), so the paint area is the
        // glyph box — cheap. Do NOT reuse this on large blocks.
        shift: {
          '0%':   { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        shift: 'shift 6s linear infinite',
      },
    },
  },
  plugins: [],
};