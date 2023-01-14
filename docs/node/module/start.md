现阶段模块化开发是前端开发中的不可缺少的一部分，自从[`Nodejs`](https://nodejs.org/en/)诞生，`Commonjs`就作为`Nodejs`的模块化规范，其中`require`语句就是模块化的核心语法，功能用来加载模块，掌握`require`运行机制，能够更好地理解`Nodejs`模块化，Node版本为`v16.19.0`

## 基本用法
```js
// 加载模块类型
const fs = require('fs') // 加载原生模块
require('axios') // 加载第三方库
require('./a.js') // 加载本地文件
```

::: code-group
```js [main.js]
// 加载文件类型
const a = require('./test.js')
const json = require('./test.json')
import('./test.mjs') // 使用import来加载mjs文件，require不能加载
const md = require('./test.md')

console.log(a) // { test: 'js' }
console.log(json) // { test: 'json' }
console.log(md) // { test: 'md' }
```
```js [test.js]
console.log('load js')
module.exports = { test: 'js' }
```
```js [test.json]
{ test: 'js' }
```
```js [test.mjs]
console.log('mjs')
```
```js [test.md]
console.log('load md')
module.exports = { test: 'js' }
```
:::

依次会输出:

load js -> load md -> { test: 'js' } -> { test: 'json' } -> { test: 'md' } -> mjs

可以看到加载顺序，`require`是同步加载，`import`是异步加载的

## 如何调试`require`
以下面的代码为例，可以利用工具在`require`代码处打上断点，进入源码调试
```js
require('detect-port')
```
以`VSCode`为例，`launch.json`中的`node`的配置项
```json
{
  "type": "node",
  "request": "launch",
  "name": "Launch Program",
  "skipFiles": [
    // "<node_internals>/**" // 这里一定要注释掉，不然无法进入到node内部模块
  ],
  "program": "${workspaceFolder}/docs/node/module/test-require.js", // 写自己需要执行的文件
}
```

## 总结
`require`支持加载模块类型：
- `node`原生模块
- `node_module`模块
- `本地`模块

`require`支持加载的文件类型:
- `.js`
- `.json`
- `.mjs` (es module，使用`import`语句加载)
- `.node` (c++文件，内部使用)
- 其他文件(会按照`.js`文件处理)

了解了`require`的特性后，我们接下来就深入分析`require`是如何加载模块类型和处理文件类型的
