:::tip 作用
取消请求是一个非常有用的特性，能够中断服务端还没有响应的数据，防止接口重复，导致一些可能产生的数据紊乱，也可以减少服务端压力
:::
### 基本用法
```js
// 方式1
const controller = new AbortController();

axios.get('/foo/bar', {
   signal: controller.signal
}).then(function(response) {
   //...
});
// 取消请求
controller.abort()

// 方式2
const CancelToken = axios.CancelToken;
let cancel;

axios.get('/user/12345', {
  cancelToken: new CancelToken(function executor(c) {
    // executor 函数接收一个 cancel 函数作为参数
    cancel = c;
  })
});

// 取消请求
cancel();
```
可以看到有两个方式来取消请求`AbortController`和`CancelToken`，在分析代码之前我们先把`AbortController`的基本用法弄清楚，方便后面源码的分析。
### AbortController
*AbortController 接口表示一个控制器对象，允许你根据需要中止一个或多个 Web 请求*，更具体的内容，可以点击[传送门](https://developer.mozilla.org/zh-CN/docs/Web/API/AbortController)了解，我们直接看示例代码
```js
const controller = new AbortController() // 初始化AbortController
const onCanceled = () => {
  console.log(`after trigger---${controller.signal.aborted}`)
}
controller.signal.addEventListener('abort', onCanceled)
setTimeout(() => {
  controller.abort()
}, 4000)
console.log(console.log(`before trigger---${controller.signal.aborted}`))
```
因为`controller.signal`的对象接口`AbortSignal`是继承于`EventTarget`，所以拥有父类的`addEventListener`、`removeEventListener`等方法
上述代码执行流程:
- 创建一个中断控制器对象，让信号对象`controller.signal`监听`abort`中断事件，并输出``before trigger---false``
- `4s`过后，执行了中断方法，这个时候会信号对象会监听到`abort`，并执行回调函数`onCanceled`
- 输出结果`after trigger---true`，可以看到`controller.signal.aborted`从false变为true

这样一个模拟的异步取消请求的操作就实现了，接下来我们来具体看看`CancelToken`的实现
### CancelToken
源码目录在`cancel/CancelToken.js`目录下
```js [CancelToken.js]
import CanceledError from './CanceledError.js';
class CancelToken {
  constructor(executor) {
    if (typeof executor !== 'function') {
      throw new TypeError('executor must be a function.')
    }
    let resolvePromise;
    this.promise = new Promise(function promiseExecutor(resolve) {
      resolvePromise = resolve; // 未来用来改变Promise状态(pending -> fulfilled)
    });
    const token = this;
    //... 此处代码省略 后续展开详解
    executor(function cancel(message, config, request) {
      if (token.reason) {
        // Cancellation has already been requested
        return;
      }
      token.reason = new CanceledError(message, config, request);
      resolvePromise(token.reason); // 改变Promise的状态。用来异步取消请求
    });
  }
  throwIfRequested() { // 抛出错误异常
    if (this.reason) {
      throw this.reason;
    }
  }
  subscribe(listener) { // 订阅取消请求时，执行的回调函数，可以有多个
    if (this.reason) { 
      listener(this.reason);
      return;
    }
    if (this._listeners) {
      this._listeners.push(listener);
    } else {
      this._listeners = [listener];
    }
  }
  unsubscribe(listener) { // 删除之前订阅过的回调函数
    if (!this._listeners) {
      return;
    }
    const index = this._listeners.indexOf(listener);
    if (index !== -1) {
      this._listeners.splice(index, 1);
    }
  }
  static source() { // 静态方法
    let cancel;
    const token = new CancelToken(function executor(c) {
      cancel = c;
    });
    return {
      token,
      cancel
    };
  }
}
export default CancelToken;
```
要理解`CancelToken`类的实现及其相关的**变量**和**方法**，其实我们只要类比于`AbortController`就很容易理解，对应的变量及方法的用途。

**相似点:**
  - `reason`变量相当于`AbortController`中的`signal.aborted`，作为一个请求是否中断的标识
  - `reason`值的改变是通过传入的`executor`函数执行所改变，而`signal.aborted`是通过`controller.abort()`来改变，不同的是，`reason`的值是一个对象，而`signal.aborted`是布尔值
  - `subscribe`跟`unsubscribe`其实跟`addEventListener`跟`removeEventListener`作用一样，都是用来绑定和解除`当请求取消时`的回调函数

**不同点:**

- `CancelToken`基于`Promise`来实现异步控制请求，通过`executor`函数的执行改变`Promise`的状态(pending -> fulfilled)，从而将`reason`异步赋值，达到`controller.abort()`函数的效果
- `CancelToken`多了一个`source`的静态方法，能够直接导出`token`(CancelToken的实例对象)和一个`cancel`取消请求的方法(用户直接调用这个方法就可以取消请求)

相信到这里，大家应该明白了`CancelToken`的大体实现跟作用了。
接下来，我们重点看看`new CancelToken`的时候，具体的做了什么
### new CancelToken
```js:line-numbers {9-29}
constructor(executor) {
  let resolvePromise
  // 给实例上添加一个promise对象
  this.promise = new Promise(function promiseExecutor(resolve) {
    resolvePromise = resolve;
  });
  const token = this;
  // 当this.promise的状态从pending变成fulfilled时候触发
  this.promise.then(cancel => {
    if (!token._listeners) return;
    let i = token._listeners.length;
    while (i-- > 0) {
      token._listeners[i](cancel);
    }
    token._listeners = null;
  });
  // 重写this.promise.then函数
  // 因为CancelToken是公用接口，为了保持之前接口特性 不过基本用不到
  this.promise.then = onfulfilled => {
    let _resolve;
    // eslint-disable-next-line func-names
    const promise = new Promise(resolve => {
      token.subscribe(resolve);
      _resolve = resolve;
    }).then(onfulfilled);
    promise.cancel = function reject() {
      token.unsubscribe(_resolve);
    };
    return promise;
  };
  executor(function cancel(message, config, request) {
    // 传入的执行函数，用来改变this.promise的状态(pending->fulfilled)
    if (token.reason) {
      // Cancellation has already been requested
      return;
    }
    // 给reason赋值，用于后续的判断和输出
    token.reason = new CanceledError(message, config, request);
    resolvePromise(token.reason); // 改变Promise的状态。用来异步取消请求
  });
}
```
我们先把`CancelToken`初始化的执行流程过一遍:

- 首先给`this.promise`赋值一个`Promise`对象，并把`Promise`的`resolve`函数赋值给了<span style="color: red;">resolvePromise</span>变量
- <span style="color: red;">执行</span>`this.promise.then`方法，在微任务中推入一个函数，会在当前宏任务执行完后，再执行`this._listeners`中订阅过的所有回调函数
- <span style="color: red;">重写</span>`this.promise.then`方法，这么做是因为`CancelToken`本身是一个公用的接口，为了保持之前`CancelToken`的接口特性，具体原因可以[链接](https://github.com/axios/axios/pull/3305/files)，个人感觉基本上也用不到，不用太关注
- 执行传入的`executor`函数，`executor`本身的入参就是一个`cancel`函数(用来改变`this.promise`的状态和给`reason`赋值)，执行`cancel`就能够取消请求

具体执行请求取消的逻辑在`adapters/xhr.js`文件中
```js
const request = new XMLHttpRequest()
// ...省略代码
let onCanceled
function done() { // 在'onloadend'中执行(不论请求失败还是请求成功)，取消对应的事件监听
  if (config.cancelToken) {
    config.cancelToken.unsubscribe(onCanceled);
  }

  if (config.signal) {
    config.signal.removeEventListener('abort', onCanceled);
  }
}

if (config.cancelToken || config.signal) {
  // 旧代码通过promise.then来调用取消请求
  config.cancelToken.promise.then(function onCanceled(cancel) { // [!code --]
    if (!request) { // [!code --]
      return; // [!code --]
    } // [!code --]
    request.abort(); // [!code --]
    reject(cancel); // [!code --]
    // Clean up request // [!code --]
    request = null; // [!code --]
  }); // [!code --]
  // 新代码通过发布订阅的模式来执行取消请求
  onCanceled = cancel => { // [!code ++]
    if (!request) { // [!code ++]
      return; // [!code ++]
    } // [!code ++]
    reject(!cancel || cancel.type ? new CanceledError(null, config, request) : cancel); // [!code ++]
    request.abort(); // 中断请求 // [!code ++]
    request = null; // 将请求对象置空 // [!code ++]
  }; // [!code ++]

  config.cancelToken && config.cancelToken.subscribe(onCanceled); // [!code ++]
  if (config.signal) { // [!code ++]
    // 监听abort事件，如果执行了controller.abort() 就会触发onCanceled // [!code ++]
    config.signal.aborted ? onCanceled() : config.signal.addEventListener('abort', onCanceled); // [!code ++]
  } // [!code ++]
}
```
取消逻辑也很简单

- 在创建请求的同时，监听`onCanceled`取消请求的函数，当`取消请求的标识位`变化时，就触发对应的监听函数来取消请求
- 当请求完成时，就删除对应监听函数