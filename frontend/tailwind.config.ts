import type { Config } from 'tailwindcss'

// 品牌色改为 CSS 变量驱动，主题切换只需改变量值，组件代码零改动
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        rose: {
          50: v('rose-50'), 100: v('rose-100'), 200: v('rose-200'), 300: v('rose-300'),
          400: v('rose-400'), 500: v('rose-500'), 600: v('rose-600'), 700: v('rose-700'),
          800: v('rose-800'), 900: v('rose-900'),
        },
        pink: {
          50: v('pink-50'), 100: v('pink-100'), 200: v('pink-200'), 300: v('pink-300'),
          400: v('pink-400'), 500: v('pink-500'), 600: v('pink-600'),
        },
      },
    },
  },
  plugins: [],
}
export default config
