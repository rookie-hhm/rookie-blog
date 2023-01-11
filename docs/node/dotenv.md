相信熟悉`Vue`开发的同学来说，项目中`*.env`的配置都不陌生，通过在`.env`文件中添加键值对，将键值对挂载到`process.env`对象上，方便使用。

[`dotenv`](https://www.npmjs.com/package/dotenv)就能够实现这个作用，通过读取`.env`文件中的内容，解析出键值对，并挂载到`process.env`变量对象上。

## 基本用法
```js
// dotenv用法 test.js
const dotenv = require('dotenv')
process.env.NAME = '2323'
const config = dotenv.config()
console.log(config.parsed) // { NAME: ROOKIE, AGE: 18, SEX: MALE }
// .env文件在项目根目录下
NAME=ROOKIE
AGE=18
SEX=MALE

// 挂载到process.env
console.log(process.env.NAME) // 2323 
console.log(process.env.AGE) // 18
console.log(process.env.SEX) // MALE
```
从上面这个例子可知道，我们可以倒推出`dotenv`实现步骤:

- 读取指定目录下的配置文件
- 解析出键值对
- 将键值对挂载到`process.env`对象上，并且如果`key`已经存在`process.env`对象上，就不会挂载
- 返回解析出来的键值对对象

接下来，我们来实现一个简版的`dotenv`

## 基本实现
```js
const nodePath = require('path') // 用来获取文件路径
const fs = require('fs') // 读取文件信息
const defaultConfig = { // 默认配置
  path: nodePath.resolve(process.cwd(), '.env'), // process.cwd() 返回执行目录
  encoding: 'utf-8' // 编码方式
}

const parse = string => { // 解析键值对
  console.log(string, 'string')
  const arr = string.split('\n') // 通过换行符分割成数组
  const result = {}
  arr.forEach(item => {
    const expression = item.trim()
    const [key, value] = expression.split('=')
    result[key] = value
  })
  return result
}

const config = (options) => { // config函数
  try {
    const { path, encoding } = options || defaultConfig
    // 找到需要解析的文件
    const file = nodePath.resolve(path)
    // 读取文件内容
    const content = fs.readFileSync(file, encoding)
    // 解析键值对
    const parsed = parse(content)
    // 挂载键值对到process.env对象上
    Object.keys(parsed).forEach(key => {
      if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
        // process.env不存在key才会挂在
        process.env[key] = parsed[key]
      }
    })

    return {
      parsed
    }
  } catch(err) {
    return { err }
  }
}

module.exports = {
  config
}
```
一个基本的`dotenv`功能就实现了，源码中对`parse`函数有更多一些正则处理，对传入的`options`也有一些前置处理，感兴趣可以直接看[源码](https://github.com/motdotla/dotenv/blob/master/lib/main.js)

::: tip 总结
`dotenv`实际就是利用`path`库来获取文件位置，接着用`fs`库来读取文件的内容，通过正则处理解析文件内容，将文件内容转成键值对对象，最后将对象挂载到`process.env`对象上
:::
