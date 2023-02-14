对于源码学习而言，为了清楚了解源码的运行逻辑，掌握源码调试是必须的，这能让你的源码学习效率大大提升。接下来我们来调试`Vue3`源码

### 下载源代码
将仓库源代码下载到本地
```sh
git clone https://github.com/vuejs/core.git
```

### 安装依赖
`Vue3`是基于`pnpm`进行代码管理的，可以使用`npm`安装`pnpm`
```sh
npm i -g pnpm
```
执行命令，安装依赖
```sh
pnpm install
```

### 打包
在`package.json`的`scripts`脚本命令中添加指令，生成源代码的sourcemap，用于源码映射
```sh
"build:sourcemap": "node scripts/build.js -s"
```
接着执行`pnpm run build:sourcemap`，打包生成后的文件会放在`packages/vue/dist`目录下

### 创建测试目录
在`packages/vue/examples`下创建`debugger`目录，新建一个测试`html`文件
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <script src="../../dist/vue.global.js"></script>
</head>
<body>
  <div id="app"></div>
  <script>
    const { reactive, createApp } = Vue
    const obj = {
      name: "rookie"
    }
    debugger
    const proxy = reactive(obj)
    const App = {
      template: `<div>123</div>`
    }
    createApp(App).mount('#app')
  </script>
</body>
</html>
```
这样一来，我们就可以在谷歌开发者工具中，在对应文件上打上断点调试了。测试代码自行编写。
![vue-source-map](/images/vue-source-map.png)
