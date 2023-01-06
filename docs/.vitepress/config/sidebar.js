export const vue2Config = [
  {
    text: '简介',
    collapsible: true,
    items: [
      { text: '介绍', link: '/vue2/introduction/index' },
      { text: '目录结构', link: '/vue2/introduction/a' },
    ]
  },
  {
    text: '组件渲染',
    link: '/vue2/component/index',
    collapsible: true,
    items: [
      { text: '初始化', link: '/vue2/component/initial' },
      { text: '更新', link: '/vue2/component/update' },
    ]
  },
  {
    text: '响应式原理',
    link: '/vue2/observe/collect',
    collapsible: true,
    items: [
      { text: '收集依赖', link: '/vue2/observe/collect'},
      { text: '派发更新', link: '/vue2/observe/dispatch'}
    ]
  },
  {
    text: '其他',
    collapsible: true,
    items: [
      { text: 'asda', link: '/guide/other/index' }
    ]
  }
]

export const vue3Config = [
  {
    text: '前言',
    items: [
      { text: '介绍', link: '/vue3/a' },
      { text: 'bb', link: '/vue3/b' }
    ]
  }
]

export const webpackConfig = []

export const viteConfig = []


export const utilsConfig = [
  {
    text: 'Axios',
    items: [
      { text: '整体架构', link: '/front-end-utils/axios/start' },
      { text: '导出的axios是什么', link: '/front-end-utils/axios/what' },
      { text: 'axios请求实现', link: '/front-end-utils/axios/implement' },
      { text: 'dispatchRequest', link: '/front-end-utils/axios/dispatchRequest' },
      { text: '响应拦截器', link: '/front-end-utils/axios/interceptor' },
      { text: '请求取消', link: '/front-end-utils/axios/cancel' }
    ]
  },
  {
    text: 'Lodash',
    items: [
      { text: '前言', link: '/front-end-utils/lodash/start' },
      { text: '核心流程', link: '/front-end-utils/lodash/core' }
    ]
  }
]

export const nodeConfig = [
  {
    text: '脚手架',
    items: [
      { text: '概念及实现原理', link: '/axios/introduction/index' },
      { text: '脚手架常用库', link: '' },
      { text: 'lerna解析', link: '' }
    ]
  },
  {
    text: 'npm库',
    items: [
      { text: 'dotenv', link: '' },
      { text: 'ora', link: '' },
      { text: 'ejs', link: '' }
    ]
  },
  {
    text: 'koa源码解析',
    collapsible: true,
    items: [
    ]
  }
]