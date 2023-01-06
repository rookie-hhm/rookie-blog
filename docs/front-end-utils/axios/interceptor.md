::: tip 作用
拦截器主要对请求发送前和接受响应后的配置进行修改，也可以在这里处理业务相关的逻辑
::: 
## 基本用法
```js
const instance = axios.create({...})
const firstId = instance.request.interceptors.use(config => {
  // 对请求配置修噶
  return config
}, error => {
  // 对错误进行处理
})
// 取消拦截器
instance.request.interceptors.eject(firstId)

const secondId = instance.response.interceptors.use(response => {
  // 响应处理
}, error => {
  // 错误处理
})
```

## 代码解析
拦截器的相关源码在[这里](https://github.com/axios/axios/blob/v1.x/lib/core/InterceptorManager.js)
代码不多，总共就几十行，代码如下
```js
class InterceptorManager {
  constructor() {
    this.handlers = [];
  }
  use(fulfilled, rejected, options) { // 注册拦截器
    // 没注册一个拦截器就会往handlers数组中末尾追加一个构造好的对象
    this.handlers.push({
      fulfilled,
      rejected,
      synchronous: options ? options.synchronous : false, // [!code ++]
      runWhen: options ? options.runWhen : null // [!code ++]
    });
    return this.handlers.length - 1;
  }
  eject(id) { // 通过索引值，删除拦截器
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }
  clear() { // 清空拦截器
    if (this.handlers) {
      this.handlers = [];
    }
  }
  forEach(fn) { // 遍历拦截器，并对handlers数组中的每一个handler进行处理
    utils.forEach(this.handlers, function forEachHandler(h) {
      // h就是handlers中对应的元素
      if (h !== null) {
        // fn 处理函数
        fn(h);
      }
    });
  }
}
```
拦截器的参数比之前多了两个`synchronous`和`runWhen`，主要解决请求延迟的问题，[具体链接](https://github.com/axios/axios/issues/2609)
之前我们在分析`axios请求实现`时，已经把拦截器跟请求相结合的原理分析完了，同时在初始化`Axios`实例的时候，有这么段代码，就是创建对应的请求、响应拦截器对象
```js
class Axios {
  constructor(instanceConfig) {
    this.defaults = instanceConfig;
    this.interceptors = {
      request: new InterceptorManager(), // 创建对应的拦截器管理器
      response: new InterceptorManager()
    };
  }
}
```
接下来，来看看`axios`中非常重要且有用的特性[取消请求](./cancel.md)
