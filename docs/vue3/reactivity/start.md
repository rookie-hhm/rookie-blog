进入`Vue3`的响应式系统学习之前，我们先了解下什么是响应式数据，并且比较`Vue2`跟`Vue3`响应式实现的区别，并且详细分析为什么要这么做。

### 响应式数据
> 当一个数据变化时，能够引起视图变化或者计算结果变化等现象，那么这个数据就是一个响应式数据

其实我的理解就是，当这个数据变化的时候，能够产生了一个**副作用**，这个副作用是一个现象(视图更新，计算结果变化等)

以下面的`代码1`为例子，我们统计一个打工仔的年薪
```js
const moneyInfo = {
  money: 12, // 一个月的工资
  month: 12 // 一年十二个月
}

const totalMoney = moneyInfo.money * moneyInfo.month
console.log(totalMoney) // 144

moneyInfo.month = 15
console.log(totalMoney) // 144
```
从代码中可以看到，第一次我们计算年薪的时候是按`12 * 12`的方式计算的，我们输出`totalMoney`的值是`144`。后面公司赚钱了，这个时候一年按15个月的工资进行发放，这个时候输出`totalMoney`依旧是`144`。

我们希望`moneyInfo.month`发生变化时，能够自动的对`totalMoney`进行重新计算，如果能够做到这点，那`moneyInfo.month`就是一个响应式数据。

我们在代码中添加一个`effect`副作用函数(用来包裹`totalMoney`的计算)，当我们每次更新`moneyInfo.month`都触发`effect`，改造后的`代码2`如下:
```js
const moneyInfo = {
  money: 12, // 一个月的工资
  month: 12 // 一年十二个月
}
let totalMoney = 0
const effect = () => {
  totalMoney = moneyInfo.money * moneyInfo.month
}
effect() // 第一次计算
console.log(totalMoney) // 144

moneyInfo.month = 15
effect() // 第二次计算
console.log(totalMoney) // 180
```
可以看到`totalMoney`能够输出`month`更改后的值，但是每次都要手动执行`effect`函数才可以更新，很繁琐。接下来，我们来看看`Vue2`是如何将这个过程进行隐藏和简化的。

### Vue2响应式
熟悉`Vue2`的同学们都知道，`Vue2`的响应式是基于[`Object.defineProperty`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)实现的，改造后的`代码3`如下:
```js
const moneyInfo = {
  money: 12, // 一个月的工资
  month: 12 // 一年十二个月
}

let totalMoney = 0
const effect = () => {
  totalMoney = moneyInfo.money * moneyInfo.month
}
effect() // 第一次计算
console.log(totalMoney) // 144
Object.defineProperty(moneyInfo, 'month', {
  set(newVal) {
    moneyInfo.month = newVal
    effect()
  },
  get() {
    // ...
  }
})
moneyInfo.month = 15 // 触发effect函数
console.log(totalMoney) // 180
```
从代码中可以看到，在进行`moneyInfo.month = 15`赋值操作后，会触发`month`定义的`setter`，从而触发`effect`更新计算结果。

不过如果这个时候`moneyInfo.money`月薪变化了想让计算结果也发生变化，就要给属性`money`进行`Object.defineProperty`拦截。如果存在多个属性，就需要对每一个属性都进行拦截，这个问题在`Vue3`中得到了很好的解决，我们来看看`Vue3`的实现。

### Vue3响应式
`Vue3`的响应式原理是基于[`Proxy`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)实现的，改造后的`代码4`如下:
```js
const moneyInfo = {
  money: 12, // 一个月的工资
  month: 12 // 一年十二个月
}
let totalMoney = 0
const effect = () => {
  totalMoney = moneyInfo.money * moneyInfo.month
}
const proxyTarget = new Proxy(moneyInfo, {
  get() {
    // ..
  },
  set(target, key, value, receiver) {
    effect()
  }
})

effect() // 第一次计算
console.log(totalMoney) // 144

proxyTarget.month = 15 // 触发effect函数
console.log(totalMoney) // 180

proxyTarget.money = 15 // 触发effect函数
console.log(totalMoney) // 225
```
可以看到`Proxy`对整个对象进行了代理(包括所有的属性)，不需要对每一个属性进行`Object.defineProperty`拦截

### Vue2响应式有什么缺陷？
摘自[Vue2官网](https://v2.cn.vuejs.org/v2/guide/reactivity.html)中的一句话
> 由于 JavaScript 的限制，Vue 不能检测数组和对象的变化。尽管如此我们还是有一些办法来回避这些限制并保证它们的响应性。

#### 对象
`Vue2`不能对对象的新增的属性，自动添加响应式
```js
var vm = new Vue({ // 对象
  data:{
    a:1
  }
})
// `vm.a` 是响应式的
vm.b = 2
// `vm.b` 是非响应式的
```

#### 数组
`Vue2`不能检测以下数组的变动：
- 当你利用索引直接设置一个数组项时，例如：vm.items[indexOfItem] = newValue
- 当你修改数组的长度时，例如：vm.items.length = newLength

```js
var vm = new Vue({
  data: {
    items: ['a', 'b', 'c']
  }
})
vm.items[1] = 'x' // 不是响应性的
vm.items.length = 2 // 不是响应性的
```
如果希望对对象或者数组进行响应式监听的话，需要手动调用`Vue.$set`方法。

### 总结
- `Proxy`能够代理整个对象，能够扩展对象的能力，写法更加便捷
- `Object.defineProperty`需要对对象的属性进行深度的遍历和监听，无法动态监听对象属性的删除增加，需要手动执行`$set`方法触发依赖收集。如果是嵌套对象的话，还需要进行递归，会影响性能
