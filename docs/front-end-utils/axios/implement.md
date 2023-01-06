## 代码实现
`axios`核心代码的实现在`core/Axios.js`下，大致的代码如下:
```js
class Axios {
  constructor(instanceConfig) {
    this.defaults = instanceConfig;
    this.interceptors = { // 定义拦截器对象
      request: new InterceptorManager(),
      response: new InterceptorManager()
    };
  }

  request(configOrUrl, config) { // 请求方法核心实现
    // 处理配置
    processConfig()
    // 处理断言类型
    processAssert()
    // 处理请求头
    processHeaders()
    // 处理链式promise和拦截器
    processPromiseChain()
    // return promise // 返回一个promise
  }

  getUri(config) { // 获取当前axios的URL地址
    config = mergeConfig(this.defaults, config);
    const fullPath = buildFullPath(config.baseURL, config.url);
    return buildURL(fullPath, config.params, config.paramsSerializer);
  }
}
```
### processConfig
处理传入的config配置
```js
// 支持 request(config) 和 request(url, config) 两个调用方式
if (typeof configOrUrl === 'string') {
  config = config || {};
  config.url = configOrUrl;
} else {
  config = configOrUrl || {};
}
// 合并配置
config = mergeConfig(this.defaults, config);
```
### processAssert
断言数据类型, `validator`方法在`core/helpers/validator`下，感兴趣的可以看下实现
```js
const {transitional, paramsSerializer, headers} = config;
if (transitional !== undefined) {
  // 具体的作用可参考链接 https://github.com/axios/axios/pull/3688
  validator.assertOptions(transitional, {
    silentJSONParsing: validators.transitional(validators.boolean),
    forcedJSONParsing: validators.transitional(validators.boolean),
    clarifyTimeoutError: validators.transitional(validators.boolean)
  }, false);
}

if (paramsSerializer !== undefined) {
  // 最新版的paramsSerializer 是第一个对象,旧版本的是一个函数
  // 断言paramsSerializer对象中的encode和serialize是函数
  validator.assertOptions(paramsSerializer, {
    encode: validators.function,
    serialize: validators.function
  }, true)
}
```

### processHeader
首先在处理请求头信息之前，我们在`processConfig`有一步合并配置的操作
```js
config = mergeConfig(this.defaults, config)
```
接着，这里同时也会把`headers`的默认配置进行合并,默认配置的文件在`defaults/index.js`中
```js
const defaults = {
  ....
  headers: {
    common: {
      'Accept': 'application/json, text/plain, */*'
    }
  }
}
utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
  defaults.headers[method] = {};
})

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
})
```
所以`axios`是支持我们对*每一个请求方法*设置不同的`headers`的，比如你可以这么定义
```js
// 方式一
{
  headers: {
    common: { ... },
    get: { ... }
  }
}
// 方式二 直接定义在最外层
{
  headers: {
    ....
  }
}
// 通常用来这是各个请求默认的请求配置，这样每次发起不同请求方式的请求，可以对配置进行复用
axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
axios.defaults.headers.post['a'] = 'bb';
```
接下来我们来看`processHeader`的处理逻辑
```js
let contextHeaders;
// 将common的请求头和当前请求方法的请求头进行合并，生成一个新的请求头
contextHeaders = headers && utils.merge(
  headers.common,
  headers[config.method]
);
// 删除默认的请求头，干掉冗余的数据
contextHeaders && utils.forEach(
  ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
  (method) => {
    delete headers[method];
  }
);
// 通过AxiosHeaders设置请求头，并返回一个对象，赋值给config.headers
config.headers = AxiosHeaders.concat(contextHeaders, headers);
```
最后通过`AxiosHeaders.concat`方法生成对象是一个给打平的对象，具体实现我们在后面章节进行分析，这里的作用就是把最终处理生成的headers赋值给了`config.headers`

### processPromiseChain
将请求跟拦截器关联起来，并返回一个`promise`链式调用对象

首先对请求拦截器数组跟响应拦截器数组进行赋值操作
```js
const requestInterceptorChain = [] // 请求拦截器的数组
let synchronousRequestInterceptors = true; // 处理请求拦截器同步的标识

this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
  // 设置runWhen参数可以过滤掉特定的拦截器
  if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
    return;
  }
  // 如果其中一个请求拦截器是异步的话，这个值就会设置为false，之后会走异步的处理逻辑
  synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;
  // 每次都往数组前面插入拦截器，所以拦截器是从后往前执行的
  // 只有当全部的请求拦截器是同步拦截器，才会走下面的同步处理逻辑
  requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
});

const responseInterceptorChain = []
this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
  // 每次往数组后面插入拦截器，所以响应拦截器是从前往后依次执行
  responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
});
```
**接着需要对拦截器进行同步或者异步的处理**
```js{21-44}
// 分成同步与异步的拦截器 参考链接 https://github.com/axios/axios/pull/2702
let promise;
let i = 0;
let len;

if (!synchronousRequestInterceptors) { // 原版的，异步处理
  const chain = [dispatchRequest.bind(this), undefined];
  chain.unshift.apply(chain, requestInterceptorChain);
  chain.push.apply(chain, responseInterceptorChain);
  len = chain.length;

  promise = Promise.resolve(config);
  // 通过promise.then来处理拦截器函数，在请求拦截器的所有微任务执行完之后，才会发出实际的请求
  while (i < len) {
    promise = promise.then(chain[i++], chain[i++]);
  }

  return promise;
}
// 同步执行拦截器
len = requestInterceptorChain.length;
let newConfig = config;
i = 0;
while (i < len) { // 直接遍历循环拦截器数组，同步执行拦截器函数
  const onFulfilled = requestInterceptorChain[i++];
  const onRejected = requestInterceptorChain[i++];
  try {
    newConfig = onFulfilled(newConfig);
  } catch (error) {
    onRejected.call(this, error);
    break;
  }
}
try {
  // 同步执行完请求拦截器函数后，同步执行请求，不会有请求延迟的问题
  promise = dispatchRequest.call(this, newConfig);
} catch (error) {
  return Promise.reject(error);
}
i = 0;
len = responseInterceptorChain.length;
while (i < len) {
  promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
}
return promise
```
可以从代码上看到，在原版和旧版中，主要是对`请求拦截器`的调用方式做了区分处理

- 默认情况下会走异步的处理逻辑(即请求拦截器的会用`promise.then`的方式来处理`config`)，相当于此次请求不是同步发出的，而是在微任务处理完(这里是指处理完请求拦截器的微任务)，才会发出请求
- 如果给拦截器的`synchronous`参数设置为`true`(变成同步拦截器)，当且仅当所有的请求拦截都是同步拦截器才会走同步逻辑(直接通过while循环遍历，请求拦截器的数量，执行请求拦截器，这些操作都是在同一个宏任务当中)，接着同步发出请求，这样请求就不会有延迟的问题
::: tip 总结
默认情况下，请求拦截器和响应拦截器都是通过`promise`的方式串联起来，请求会以异步的方式发出，造成请求延迟的现象。如果是设置了同步的请求拦截器，那么请求会以同步的方式发出。
:::

axios请求实现的大题流程基本就分析完了，接下来，着重看看实际发出请求的`dispatchRequest`方法。



