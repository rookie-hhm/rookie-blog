### 项目架构
`Vue3`是使用[`pnpm`](https://pnpm.io/)管理的项目，源码采用`Monorepo`方式进行管理。

Monorepo特点:

- 一个仓库可维护多个模块或者项目
- 方便版本和依赖管理，项目中模块之间的引用会变得简单
- 会导致项目体积变大

### 源码目录结构
- compiler-core: 编译器核心模块
- compiler-dom: 浏览器的编译模块
- compiler-sfc: *.vue文件的编译模块
- compiler-ssr: ssr编译模块
- runtime-core: 运行时核心模块
- runtime-dom: 浏览器的运行时
- runtime-test: 测试
- reactivity: 响应式系统
- server-renderer: 服务端渲染
- size-check: 测试打包体积
- shared: 公共的工具方法
- vue-compat: 兼容vue2模块
- vue: 完整的vue代码，包含编译时和运行时
- sfc-playground: 在线编辑[平台](https://sfc.vuejs.org)
- template-explorer: 用于调试编译器输出的[工具](https://template-explorer.vuejs.org)

强烈建议大家在后续学习的时候，多多利用[template-explorer](https://template-explorer.vuejs.org)这个网站，能够更好地帮助你理解编译的过程，理清编译器的产出代码。

我们知道`Vue3`是采用`Monorepo`管理包的，所以每一个目录都是一个项目，那么`Vue3`是如何管理多个项目的打包构建的呢？接下来，我们一起来看看核心的实现代码

### 打包构建
从`package.json`文件中可以看到，打包构建的代码在`scripts/build.js`下
```json
"scripts": {
  "build": "node scripts/build.js"
}
```
```js
import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import path from 'node:path'
import execa from 'execa'
// 创建require函数 (commonjs中的require)
const require = createRequire(import.meta.url)
import { cpus } from 'node:os'

const targets = fs.readdirSync('packages').filter(f => { // 获取packages目录下的目录
  if (!fs.statSync(`packages/${f}`).isDirectory()) {
    return false
  }
  const pkg = require(`../packages/${f}/package.json`)
  if (pkg.private && !pkg.buildOptions) {
    return false
  }
  return true
})

run()

async function run() { // 执行构建
  buildAll(targets)
}

async function buildAll(targets) { // 构建包
  // cpus() CPU内核的对象数组
  await runParallel(cpus().length, targets, build)
}

async function runParallel(maxConcurrency, source, iteratorFn) { // 控制并发构建的数量
  const ret = []
  const executing = []
  for (const item of source) {
    const p = Promise.resolve().then(() => iteratorFn(item, source))
    ret.push(p)

    if (maxConcurrency <= source.length) {
      // 当前任务执行完之后，从executing列表中删除
      const e = p.then(() => executing.splice(executing.indexOf(e), 1))
      executing.push(e)
      if (executing.length >= maxConcurrency) {
        // 需要等期中一个Promise执行完，才会进入下一个for循环逻辑
        await Promise.race(executing)
      }
    }
  }
  return Promise.all(ret)
}

async function build(target) { // 单个包的处理逻辑
  const pkgDir = path.resolve(`packages/${target}`)
  const pkg = require(`${pkgDir}/package.json`)

  const env =
    (pkg.buildOptions && pkg.buildOptions.env) ||
    (devOnly ? 'development' : 'production')
  // 执行rollup最后会执行根目录下的rollup.config.js配置文件
  // 并设置一系列的环境变量，这样子在rollup.config.js中通过process.env获取
  // 当前需要打包的目录、输出格式等信息
  await execa(
    'rollup',
    [
      '-c',
      '--environment',
      [
        `COMMIT:${commit}`,
        `NODE_ENV:${env}`,
        `TARGET:${target}`, 
        formats ? `FORMATS:${formats}` : ``,
        prodOnly ? `PROD_ONLY:true` : ``,
        sourceMap ? `SOURCE_MAP:true` : ``
      ]
        .filter(Boolean)
        .join(',')
    ],
    { stdio: 'inherit' } // 能够将打包信息输出到控制台
  )
}
```
打包逻辑如下:

- 通过`fs.readdirSync`获取`packages`下的所有目录`targets`数组列表
- 执行`run`方法，将`targets`传入`buildAll`函数中
- 执行`runParallel`方法
  - 循环遍历`targets`中的每一项`target`
  - 通过`execa(rollup)`对`target`进行单独的打包，并控制构建打包的并发数量
  - 执行`rollup.config.js`配置文件的逻辑，打包输出到对应目录
