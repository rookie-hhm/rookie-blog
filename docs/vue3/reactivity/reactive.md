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
- 5s之后，修改了`proxy.name`的值，触发`effect`重新执行，`result`变成`rookie1`

接下来，我们来分析下`reactive`和`effect`到底做了什么事情

## reactive
当代码首次执行`reactive(obj)`
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
      // 相当于track(target, 'get', key)
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
当代码执行到`effect`函数时，访问到了`proxy.name`，触发`getter`逻辑
执行流程:
- 判断`target`是不是一个数组，得到标识`targetIsArray`
- 通过`Reflect.get(target, key, receiver)`获取到值`res`
- 通过`track`函数进行依赖收集(<span class="highlight">这个我们放到后面说</span>)
- 如果`res`是一个对象，则会执行`reactive(res)`，对数据进行代理

到这里我们先来对比下`Vue2`拦截过程对于**嵌套对象**的处理，加深理解
```ts
// vue2
function defineReactive (
  obj: Object,
  key: string,
  val: any
) {
  // ...
  // 递归调用observe(val)，遍历深层的属性
  let childOb = observe(val)
  // ... Object.defineProperty拦截
  Object.defineProperty(obj, key, {
    get() { },
    set() { }
  })
}
```
假设我们传入的值如下:
```js
const target = { a: { b: c: { name: 'rookie' } } }
```
对于`Vue2`而言，当访问到`target.a`时，就会不断地递归将`target`深层的的所有属性都进行，直到遍历到`c.name`属性(**即使你没有去访问深层的属性**)

对于`Vue3`而言，当访问到`target.a`时，只会对`target.a`进行一次`reactive`
```js
const target2 = reactive({ b: c: { name: 'rookie' } })
```
只有访问到`target2.b`属性的值，才会对值进行`reactive`，并不会在第一次就一直递归，起到了一个<span class="highlight">延迟执行</span>的优化作用
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
    // 省略代码..
    // target: { name: 'rookie' } -> hadKey返回 true
    const hadKey =
      isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key)
    // 设置target.key的值
    const result = Reflect.set(target, key, value, receiver)
    if (target === toRaw(receiver)) {
      if (!hadKey) {
        // 添加操作
        trigger(target, TriggerOpTypes.ADD, key, value)
      } else if (hasChanged(value, oldValue)) {
        // 设置修改操作
        trigger(target, TriggerOpTypes.SET, key, value, oldValue)
      }
    }
    return result
  }
}
```
程序5s后执行`proxy.name = 'rookie1'`，进入到`setter`逻辑
执行流程:
- 通过`target[key]`到旧值`oldValue`
- 通过条件判断获取当前`target`是否有存在`key`的标识`hadKey`，
- 如果`hadKey`为false(当前`target`没有这个`key`)，则进行添加操作，否则执行设置修改操作
- 通过`trigger`来触发更新(后面篇章分析)

## effect
```ts
export function effect<T = any>(
  fn: () => T
): ReactiveEffectRunner {
  // 省略代码..
  // 这里的fn就是 () => result = proxy.name
  const _effect = new ReactiveEffect(fn)
  _effect.run()
  const runner = _effect.run.bind(_effect)
  runner.effect = _effect
  return runner
}
```
### ReactiveEffect
```ts
let activeEffect;
export class ReactiveEffect<T = any> {
  active = true
  deps: Dep[] = []
  parent: ReactiveEffect | undefined = undefined

  constructor(
    public fn: () => T,
    public scheduler: EffectScheduler | null = null,
    scope?: EffectScope
  ) {
    // 记录当前的ReactiveEffect对象
    recordEffectScope(this, scope)
  }

  run() {
    if (!this.active) { // 初始值是true
      return this.fn()
    }
    // 省略代码...
    try {
      // 设置全局的activeEffect
      activeEffect = this
      // 执行fn
      return this.fn()
    }
  }
}
```
所以我们可以看到`effect`的主体执行流程如下:
- 通过`new ReactiveEffect(fn)`返回一个`_effect`对象
- 执行`_effect.run`就是执行`fn`函数
  - 将当前`_effect`实例对象赋值给全局变量`activeEffect`(正在执行的副作用函数)
  - 对于示例代码而言，这个时候就会执行`() => result = proxy.name`
  - 访问到了`proxy.name`就会触发`getter`
  - 从而触发`track`进行依赖收集
- 通过`_effect.run.bind(_effect)`返回一个`runner`，并将`runner.effect`设置为`_effect`，用来后续定位
- 最后返回一个`runner`(用来执行_effect.run，从而执行fn)
```

## 总结

至此我们就理清了`reactive`跟`effect`的主体逻辑，接下来我们来重点分析`track`依赖收集跟`trigger`派发更新到底是如何实现的.