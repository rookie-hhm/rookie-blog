对一些基本概念进行一定的了解，这样能加深我们对框架的理解，已经非常清楚的同学可以跳过这一块，直接进入后续的源码学习。

### 命令式变编程 VS 声明式编程
以下面场景为例子进行对比
> 找在app元素下类名为rookie的div标签，并设置该标签中的文本内容为hello rookie

命令式编程，会写出下面的代码
```html
<div id="app">
  <div class="aa">hello aa</div>
  <div class="rookie"></div>
  <div class="zz">hello zz</div>
</div>

<script>
  const message = 'hello rookie' // 结果值
  const app = document.getElementById('app')
  const rookieEle = app.querySelector('.rookie')
  if (rookieEle) {
    rookieEle.innerText = message
  }
<script>
```
声明式编程代码如下:
```html
<div id="app">
  <div class="aa">hello aa</div>
  <div class="rookie">{{ message }}</div>
  <div class="zz">hello zz</div>
</div>
```
从上面两个例子可以看出，`命令式`注重求解的过程，详细地描述了功能实现步骤，`声明式`则直接输出结果，关注的是接口，功能实现被隐藏了起来，并且对于开发者而言更易维护。

我们都知道`Vue`是一个声明式的前端框架，本质上是对外提供了声明的接口，但内部用`命令式`编程来实现复杂逻辑。

### 运行时 VS 编译时
以当前的代码为例
```html
<div id="app">
  <div class="rookie">rookie</div>
</div>
```
我们可以用下面的js代码来描述这个`Dom`结构(VNode)
```js
{
  tag: 'div',
  attrs: { id: 'app' },
  children: [
    {
      tag: 'div',
      attrs: {
        class: 'rookie'
      },
      children: ['rookie']
    }
  ]
}
```
此时如何将这个`js对象`渲染到界面上，我们需要一个`render`函数
```js
const render = (vNode, container) => {
  let ele
  if (typeof vNode === 'string') { // 文本节点
    ele = document.createTextNode(vNode)
    container.appendChild(ele)
  } else {
    // 创建节点
    const ele = document.createElement(tag)
    const keys = Object.keys(attrs)
    for (const key in keys) {
      ele.setAttribute(key, attrs[key])
    }
    if (children && children.length) {
      for (let i = 0; i < children.length; i++) {
        const childEle = children[1]
        render(childEle, ele)
        ele.appendChild(childEle)
      }
    }
  }
  return ele
}
```
执行`render`的时候才进行`Dom`渲染，这就是运行时。但是每次我们都需要手动去编写一个`虚拟Dom`对象，这个过程是非常繁琐且效率不高。

这个时候我们能不能直接通过编写一个`html`字符串，程序里有这么一个`compile`函数帮我们进行转换成`VNode`对象，减少开发者的心智负担，提升开发体验。
```js
const str = `<div id="app">
  <div class="rookie">rookie</div>
</div>`
const vNode = compile(str) // 将字符串
render(vNode, container)
```
其中`compile`就代表着`编译时`，`Vue`就是一个运行时 + 编译时的框架

### 总结

- 纯运行时: 编码比较繁琐，足够灵活
- 纯编译时: 在编译阶段直接生成代码，减少运行时代码执行的开销，但不灵活
- 运行时 + 编译时: 能够对输入进行分析，进行额外的扩展，也保留了足够的灵活性