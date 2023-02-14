`reactive`的响应式转换是深层的，会影响到所有嵌套的属性，通常用于对象、数组。

## 示例代码
**以下示例代码贯穿本章的源码分析**
```js
const { reactive, effect } = Vue
const obj = {
  name: "rookie"
}
let result = ''
const proxy = reactive(obj)
effect(() => {
  result = proxy.name
})
setTimeout(() => {
  proxy.name = 'rookie1'
}, 5000)
```
执行过程:
- `effect`首次执行，`result`变成`rookie`
- 5s之后，修改了`proxy.name`的值，触发`effect`重新执行，`result`变成`rookie`

接下来，我们来分析下`reactive`和`effect`到底做了什么事情

## reactive
```js
function reactive(target) {
  // 这里的target就是 { name: 'rookie' }
  return createReactiveObject(
    target,
    false,
    mutableHandlers,
    mutableCollectionHandlers,
    reactiveMap
  );
}
```

:::code-group
```js [reactive.js]
import {
  mutableHandlers,
  // ...
} from './baseHandlers'
const proxyMap = new WeakMap()

function createReactiveObject(target, isReadonly2, baseHandlers, collectionHandlers, proxyMap) {
  if (!isObject(target)) {
    return target;
  }
  // .. 省略代码
  // 从proxyMap获取缓存，如果存在则直接返回
  // 已经代理过的对象不会再进行代理
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  // 这里{ name: 'rookie' }拿到targetType是1
  const targetType = getTargetType(target);
  if (targetType === 0 /* INVALID */) { //无效的则直接返回
    return target;
  }
  // 因为targetType是1，所以会应用到baseHandlers
  const proxy = new Proxy(
    target,
    targetType === 2 /* COLLECTION */ ? collectionHandlers : baseHandlers
  );
  // 对target设置代理缓存
  proxyMap.set(target, proxy);
  // 最后返回一个代理对象
  return proxy;
}
```
```js [getTargetType.js]
function getTargetType(value) {
  return value["__v_skip"] || !Object.isExtensible(value) ? 0 /* INVALID */ : targetTypeMap(toRawType(value));
}
function targetTypeMap(rawType) {
  switch (rawType) {
    case "Object":
    case "Array":
      return 1 /* COMMON */;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2 /* COLLECTION */;
    default:
      return 0 /* INVALID */;
  }
}
const objectToString = Object.prototype.toString;
const toTypeString = (value) => objectToString.call(value);
const toRawType = (value) => {
  return toTypeString(value).slice(8, -1);
};

getTargetType({ name: 'rookie' }) // 返回1
:::
`reactive`主线上做的事情很简单，就是对传入的`target`对象进行`Proxy`代理，其中代理的逻辑就在`baseHandlers`对象中

### baseHandlers
设置被代理对象的一系列拦截行为
```ts
// baseHandlers对应的导出对象
export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
  // ...
}
const get = createGetter()
const set = createSetter()
```
#### createGetter
访问对象的属性的时候触发getter
```ts
function createGetter(isReadonly = false, shallow = false) {
  return function get(target: Target, key: string | symbol, receiver: object) {
    // ... 省略代码
    const targetIsArray = isArray(target); // 判断是不是数组
    // target: { name: 'rookie' } res的值为rookie
    const res = Reflect.get(target, key, receiver)

    // ..
    if (!isReadonly) {
      // 进行跟踪(依赖收集)
      track(target, TrackOpTypes.GET, key)
    }

    // 如果是res是一个ref包裹的值
    if (isRef(res)) { 
      // 如果是通过下标取值，直接返回res
      // 如果是通过其他方式取值，则进行ref的解构
      // arr['test'] = ref('test') 会通过ref解构
      return targetIsArray && isIntegerKey(key) ? res : res.value
    }

    if (isObject(res)) { // 如果是一个对象
      // reactive这里可以避免递归调用，提高性能
      return isReadonly ? readonly(res) : reactive(res)
    }

    return res
  }
}
```
- 判断`target`是不是一个数组，得到标识`targetIsArray`
- 通过`Reflect.get(target, key, receiver)`获取到值`res`
- 通过`track`函数进行依赖收集
- 如果`res`是一个对象，则会执行`reactive(res)`，对数据进行代理

到这里我们来对比下`Vue2`的依赖收集过程
```js

```

#### createSetter
设置对象属性的值的时候，会触发setter
```ts
function createSetter(shallow = false) {
  return function set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object
  ): boolean {
    let oldValue = (target as any)[key]
    if (isReadonly(oldValue) && isRef(oldValue) && !isRef(value)) {
      return false
    }
    if (!shallow) {
      if (!isShallow(value) && !isReadonly(value)) {
        oldValue = toRaw(oldValue)
        value = toRaw(value)
      }
      if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
        oldValue.value = value
        return true
      }
    } else {
      // in shallow mode, objects are set as-is regardless of reactive or not
    }

    const hadKey =
      isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key)
    const result = Reflect.set(target, key, value, receiver)
    // don't trigger if target is something up in the prototype chain of original
    if (target === toRaw(receiver)) {
      if (!hadKey) {
        trigger(target, TriggerOpTypes.ADD, key, value)
      } else if (hasChanged(value, oldValue)) {
        trigger(target, TriggerOpTypes.SET, key, value, oldValue)
      }
    }
    return result
  }
}
```
## effect


## 总结

至此我们就理清了`reactive`跟`effect`的具体逻辑，其他的分支代码也可自行分析，只要理清了主线逻辑，相信难不倒大家。