[Axios](https://axios-http.com/)，相信做前端的都知道这个非常知名的库，用于实现前后端通讯的HTTP请求库，话不多说，接下来我们一起解析Axios的特性。

[源码仓库点这里](https://github.com/axios/axios)
::: tip
当前我们阅读源码的版本是`1.2.1`
:::
## 项目目录结构
**只挑几个重点目录进行展示，让大家对`axios`项目整体有个认知，对其他目录文件有兴趣的同学可以自行阅读**
```js
| - dist // 打包后生成的文件
| - rollup.config.js // 打包文件 生成各种格式的文件
| - examples // 相当于一个playground, 可以在实例代码里打上断点，方便调试
| - lib // 核心方法的实现
  | - adapters // 适配器，适配node环境和浏览器环境
  | - cancel // 取消请求的方法
  | - core // 请求实现的核心方法
  | - defaults // 请求的默认配置
  | - helpers // 工具方法
  | - platform // 定义了平台相关的属性
  | - axios // 外层index.js 引入的入口文件
  | - utils // 工具方法
| - index.js // axios入口文件
```

## 工作流程图

![流程图](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6329104a68a0424c92723f6d16d8fd74~tplv-k3u1fbpfcp-zoom-in-crop-mark:3024:0:0:0.awebp)

可以看到`Axios`的核心工作流程如下:
- 首先从客户端发出一个请求之前，接着用户自定义的`请求拦截器`会对请求层层拦截并进行处理(**这阶段主要处理的是请求配置信息**)，接着通过`请求转换器`的处理(这个阶段可以处理请求的数据与请求头)，最后发出请求。
- 请求从服务端会的时候，首先会通过`相应转换器`的处理(这个阶段也一样，可以处理相应数据与响应头部)，接着再经过`相应拦截器`(主要处理相应配置)的层层拦截处理，最后得到想要的响应信息


好的，我们现在对`Axios`有了一个整体认识，接下来我们深入源码内部细节，一步步剖析是如何实现的。