/** @type {import('tailwindcss').Config} */
export default {
      content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
      ],
      theme: {
        extend: {
          colors: {
            primary: '#1890ff',
            success: '#52c41a',
            warning: '#faad14',
            error: '#f5222d',
          },
          screens: {
            'xs': '480px',
            'sm': '576px',
            'md': '768px',
            'lg': '992px',
            'xl': '1200px',
            '2xl': '1600px',
          }
        },
      },
      plugins: [],
      corePlugins: {
        preflight: false, // 禁用Tailwind的基础样式重置，避免与Ant Design冲突
      }
    }