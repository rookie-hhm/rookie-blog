
本章我们来理清依赖收集跟派发更新的主体流程。

## 示例代码(依旧穿插着本章代码)
```html
<script>
const { reactive, effect } = Vue
const proxy = reactive({ name: 'rookie' })
let result
effect(() => {
  result = proxy.name
})
proxy.name = 'rookie1'
</script>
```

从上一章我们得知，当函数执行`effect`函数时，会有一个`ReactiveEffect`实例对象会赋值给全局的`activeEffect`
```js
const _effect = new ReactiveEffect(fn)
activeEffect = _effect 
```
接着执行`_effect.run`方法，执行传入的`fn`函数。

## track(依赖收集)

## trigger(触发更新)

## 为什么使用Reflect
在`createGetter`函数中，有这么一段代码
```js
Reflect.get(target, key, receiver) // 获取当前值
```
在`createSetter`函数中，也有这么一段代码
```js
// 1. 获取旧值
oldValue = target[key]
// 2. 设置新值
Reflect.set(target, key, value, receiver)