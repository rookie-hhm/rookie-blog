import { 
  vue2Config,
  vue3Config,
  utilsConfig,
  webpackConfig,
  viteConfig
} from "./config/sidebar";

export default {
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
          { text: 'node相关', link: '/node/index' }
        ]
      }
    ],
    sidebar: {
      '/vue2/': vue2Config,
      '/vue3/': vue3Config,
      '/webpack/': webpackConfig,
      '/vite/': viteConfig,
      '/front-end-utils/': utilsConfig,
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