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
  markdown: {
    theme: 'material-palenight',
    lineNumbers: true
  },
  themeConfig: {
    logo: '/images/logo.svg',
    outline: 'deep',
    nav: [
      { text: 'vue2源码', link: '/vue2/introduction/index' },
      { text: 'vue3源码', link: '/vue3/a' },
      { text: 'webpack源码', link: '/webpack/introduction/index' },
      { text: 'vite源码', link: '/vite/introduction/index' },
      {
        text: '其他',
        items: [
          { text: '前端工具库', link: 'front-end-utils/axios/start' },
          { text: 'Node', link: '/node/detect-port' }
        ]
      }
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