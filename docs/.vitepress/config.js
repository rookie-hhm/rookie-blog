import {
  vue2Config,
  vue3Config,
  utilsConfig,
  webpackConfig,
  viteConfig,
  nodeConfig
} from "./config/sidebar";
import path from 'path'
const outDir = path.resolve(__dirname, '../', 'dist')

export default {
  base: '/rookie-blog/dist',
  outDir,
  title: 'rookie blog',
  description: '持续学习源码',
  siteTitle: 'source-code study',
  head: [['meta', { name: 'theme-color', content: '#3c8772' }]],
  markdown: {
    lineNumbers: true
  },
  themeConfig: {
    logo: '/images/logo.svg',
    outline: 'deep',
    nav: [
      { text: 'vue3源码', link: '/vue3/introduction/start' },
      { text: '前端工具库', link: 'front-end-utils/axios/start' },
      { text: 'Node', link: '/node/detect-port' }
      // { text: 'webpack源码', link: '/webpack/introduction/index' },
      // { text: 'vite源码', link: '/vite/introduction/index' },
      // {
      //   text: '其他',
      //   items: [
      //   ]
      // }
    ],
    sidebar: {
      '/vue2/': vue2Config,
      '/vue3/': vue3Config,
      '/webpack/': webpackConfig,
      '/vite/': viteConfig,
      '/front-end-utils/': utilsConfig,
      '/node/': nodeConfig
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ],
    lastUpdatedText: 'Updated Date',
    // markdown: {
    //   headers: {
    //     level: [0, 0]
    //   }
    // }
  }
}