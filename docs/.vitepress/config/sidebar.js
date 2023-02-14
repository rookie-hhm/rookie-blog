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
    text: '准备工作',
    items: [
      { text: '前言', link: '/vue3/introduction/start' },
      { text: '源码目录', link: '/vue3/introduction/structure' },
      { text: '基本概念', link: '/vue3/introduction/base' },
      { text: '如何调试源码', link: '/vue3/introduction/debugger' }
    ]
  },
  {
    text: '响应式系统',
    items: [
      { text: '介绍', link: '/vue3/reactivity/start' },
      { text: 'reactivity', link: '/vue3/reactivity/reactive' }
    ]
  },
  {
    text: '运行时',
    items: [
      { text: '介绍', link: '/vue3/runtime/start' },
    ]
  },
  {
    text: '编译器',
    items: [
      { text: '介绍', link: '/vue3/compiler/start' }
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
    text: 'npm库',
    items: [
      { text: 'detectPort--如何监听端口号', link: '/node/detect-port' },
      { text: 'dotenv--添加环境变量', link: '/node/dotenv' },
      { text: 'ora--炫酷的loading', link: '/node/ora' },
      { text: 'chalk--增强命令行提示', link: '/node/chalk' },
      { text: 'inquirer--命令行交互神器', link: '/node/inquirer' },
      { text: 'ejs--模版引擎', link: '/node/ejs' }
    ]
  },
  {
    text: 'require--npm模块加载原理',
    items: [
      { text: '前置知识', link: '/node/module/start' },
      { text: '主流程', link: '/node/module/core' }
    ]
  }
  // {
  //   text: '脚手架',
  //   items: [
  //     { text: '概念及实现原理', link: '/axios/introduction/index' },
  //     { text: '脚手架常用库', link: '' },
  //     { text: 'lerna解析', link: '' }
  //   ]
  // },
  // {
  //   text: 'koa源码解析',
  //   collapsible: true,
  //   items: [
  //   ]
  // }
]