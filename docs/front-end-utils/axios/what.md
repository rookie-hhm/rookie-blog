我们平时所使用的axios对象是从根目录下的`index.js`导出的，我们找到入口文件，[源码文件](https://github.com/axios/axios/blob/v1.x/index.js)
导出的代码如下:
```js
import axios from './lib/axios.js';

export {
  axios as default,
  ...
}
```
可以看到导出的对象及方法都是从`lib/axios.js`文件中进行导入的，该文件的代码如下(这里只保留了核心代码):
```js
import utils from './utils.js'; // 工具方法
import bind from './helpers/bind.js'; // 相当于fn.bind(thisArg, arguments)
import Axios from './core/Axios.js'; // axios的核心实现
import mergeConfig from './core/mergeConfig.js'; // 合并配置
import defaults from './defaults/index.js'; // 默认配置

function createInstance(defaultConfig) {
  // 生成Axios实例
  const context = new Axios(defaultConfig);
  // 返回一个，将Axios原型上的request方法调用的this(指定为Axios实例对象)的函数
  const instance = bind(Axios.prototype.request, context);

  // 把Axios.prototype自身的方法都复制到instance函数上
  utils.extend(instance, Axios.prototype, context, {allOwnKeys: true});

  // 把axios的实例对象自身的属性方法复制给instance函数上
  utils.extend(instance, context, null, {allOwnKeys: true});

  // 创建一个工厂函数
  instance.create = function create(instanceConfig) {
    // 合并默认配置和传入的配置
    return createInstance(mergeConfig(defaultConfig, instanceConfig));
  };
  // 返回一个函数对象
  return instance;
}

const axios = createInstance(defaults);
export default axios
```
接着是用到的工具方法[bind](https://github.com/axios/axios/blob/v1.x/heplers/bind.js)和[工具方法](https://github.com/axios/axios/blob/v1.x/lib/utils.js)
```js
// bind 方法
function bind(fn, thisArg) { // 绑定函数的this
  return function wrap() {
    return fn.apply(thisArg, arguments);
  }
}
// forEach 方法
function forEach(obj, fn, {allOwnKeys = false} = {}) {
  if (isArray(obj)) { // 数组
    for (i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // allOwnKeys 会判断是不是该对象上的属性，
    // getOwnPropertyNames 能够遍历不可枚举属性
    // keys 方法不可以遍历不可枚举属性
    const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
    const len = keys.length;
    let key;
    for (i = 0; i < len; i++) {
      key = keys[i];
      fn.call(null, obj[key], key, obj);
    }
  }
}

// extend 方法
const extend = (a, b, thisArg, {allOwnKeys}= {}) => {
  forEach(b, (val, key) => {
    if (thisArg && isFunction(val)) {
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  }, {allOwnKeys});
  return a;
}
```

可以看到最终我们导出的`axios`是一个通过`createInstance`方法创建的函数对象，流程如下:

- 通过`new Axios(..)`创建一个`context`(axios实例对象)
- 通过`bind`方法，将`Axios`原型上的request方法，将`this`指定为axios实例对象，并返回一个执行`request`方法的函数。**代码中的`instance变量`其实是一个函数**
- 将`Axios.prototype`上的方法赋值给`instance`
- 将`context`对象上的属性方法赋值给`instance`上
- 创建一个工厂函数`create`，本质上就是`createInstance`
- 最后返回`instance`函数对象

至此，我们就分析完了`axios`导出的对象的一些基本结构了
