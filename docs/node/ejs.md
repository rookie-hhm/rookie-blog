[`ejs`](https://www.npmjs.com/package/ejs)是一个高效的嵌入式 JavaScript 模板引擎，通过数据和模版的结合，快速生成一个HTML页面，在一些需要自定义模版的工程化场景下使用频率非常的高。通过学习`ejs`的主要源码逻辑，能够更好地理解模版引擎的实现原理。

## 基本使用
```js
const ejs = require('ejs')
const str = `<h2><%= user.name %></h2>`
const data = {
  user: {
    name: 'rookie'
  }
}
const template = ejs.compile(str)
const result = template(data)
console.log(result) // <h2>rookie</h2>
```
可以看到在模版中，把`user.name`给替换成了`rookie`，我们来看看编译的核心函数`compile`的实现。<span class="highlight">示例代码会贯穿全文</span>
## 原理实现
### Compile
```js
function compile (template) {
  // .. 处理传入的options
  const templ = new Template(template, opts) // 生成一个模版对象
  return templ.compile(); // 调用模版编译方法
}
```
### Template
```js [Template.js]
function Template(text, opts) {
  opts = opts || utils.createNullProtoObjWherePossible();
  var options = utils.createNullProtoObjWherePossible(); // 生成一个空对象
  this.templateText = text;
  //.. 把opts的值处理后赋值到options对象上
  this.opts = options;
  this.regex = this.createRegex(); // 生成一个正则表达式
}
```
我们主要看下生成正则表达式的实现
```js [createRegex.js]
var _REGEX_STRING = '(<%%|%%>|<%=|<%-|<%_|<%#|<%|%>|-%>|_%>)';

function createRegex() {
  var str = _REGEX_STRING;
  var delim = escapeRegExpChars(this.opts.delimiter); // 分隔符
  var open = escapeRegExpChars(this.opts.openDelimiter); // 开始符
  var close = escapeRegExpChars(this.opts.closeDelimiter); // 关闭符
  // open + delim 表示开始字符 默认: <%
  // close + delim 表示结束字符 默认: %>

  // 对三种符号的默认值进行替换
  str = str.replace(/%/g, delim) 
    .replace(/</g, open)
    .replace(/>/g, close);
  return new RegExp(str);
}

var regExpChars = /[|\\{}()[\]^$+*?.]/g; // 特殊字符
function escapeRegExpChars (string) { // 对特殊字符前面加上`\\`，保证后面执行`new RegExp`不会报错
  // istanbul ignore if
  if (!string) {
    return '';
  }
  return String(string).replace(regExpChars, '\\$&');
}
```
执行逻辑如下：
- `_REGEX_STRING`通过`|`来分割，并且每一个的字符都是在模版中用到的操作符，比如说`<%=`就是赋值的操作符
- `escapeRegExpChars`函数会把`delimiter`分隔符进行替换操作
  - 如果传入的分隔符`delimiter`匹配到了`regExpChars`字符串，则会返回`\\delimiter`
  - 如果没有匹配到，则原值返回
- 最后通过`new RegExp`生成一个正则表达式
```js
  // 示例代码
const delimiter1 = ')'
const delimiter2 = '<'
escapeRegExpChars(delimiter1) // '\\)' 匹配到了
escapeRegExpChars(delimiter2) // '<' 没匹配到 原值返回

// 对于特殊字符需要在前面加上'\\'，为了在生成表达式时成功
new RegExp('\\)') // 成功
new RegExp(')') // 失败

new RegExp('.') // /./ 这个是匹配任意字符
new RegExp('\\.') // /\./ 这个才会匹配到字符串'.'
```
执行完`new Template`之后生成一个`template`实例，接着会调用`template原型`上的`compile`方法
### Template.compile
```js
function compile () {
  const src = generateSource() // 将字符串进行解析编译替换，生成替换后的字符串
  const fn = generateSourceFn() // 生成一个函数，内部代码为src
  const renderFn = this.generateRenderFn() // 在fn外部包裹一层function
  return renderFn // 返回可执行函数
}
```
#### generateSource
:::code-group 
```js [generateSource.js]
function generateSource() {
  let source = ''
  const matches = parseTemplateText() // 变成一个数组 ['<h2>', '<%=', ' user.name ', '%>', '</h2>']
  matches.forEach(line => source += scanLine(line))
  let prepended = // 定义了 __append方法
        '  var __output = "";\n' +
        '  function __append(s) { if (s !== undefined && s !== null) __output += s }\n';
  let appended += '  return __output;' + '\n';
  return prepended + source + appended
}
```
```js [parseTemplateText.js]
function parseTemplateText () {
  var str = this.templateText; // 解析的字符串
  var pat = this.regex;
  var result = pat.exec(str);
  var arr = [];
  var firstPos;

  while (result) {
    firstPos = result.index;

    if (firstPos !== 0) {
      arr.push(str.substring(0, firstPos));
      str = str.slice(firstPos);
    }

    arr.push(result[0]);
    str = str.slice(result[0].length);
    result = pat.exec(str);
  }

  if (str) {
    arr.push(str);
  }

  return arr;
},
```
:::
`parseTemplateText`主要是将需要解析的字符串进行分组操作，生成一个数组。在我们的例子中的话，`matches`会变成
`['<h2>', '<%=', ' user.name ', '%>', '</h2>']`，这里的算法值得借鉴学习，所以就单独拿出来，具体代码可以点击对应文件查看。`scanLine`做一些正则匹配，处理字符串，这里详细的代码就不展示了，最后生成`source`字符串如下:
```js
var __line = 1
  , __lines = "<h2><%= user.name %></h2>"
  , __filename = undefined;
try {
  var __output = "";
  function __append(s) { if (s !== undefined && s !== null) __output += s }
  with (locals || {}) {
    ; __append("<h2>")
    ; __append(escapeFn( user.name ))
    ; __append("</h2>")
  }
  return __output;
} catch (e) {
  rethrow(e, __lines, __filename, __line, escapeFn);
}
```
可以看到`__append`就是不断地往`__output`字符串中添加结果，并且利用`with`语句的特性改变作用域。我们来看看`with`的基本用法，便于后续理解
```js
// 基本用法
const data = {
  user: {
    name: 'rookie'
  }
}
with(data) {
  console.log(user.name) // 'rookie'
  // 不需要使用data.user.name 获取值
}
```

#### generateSourceFn
```js
function generateSourceFn() {
  const fn = new Function(
    opts.localsName +
    ', escapeFn, include, rethrow',
    src
  )
  return fn
}
```
通过`new Function`生成一个函数`fn`，前面的`opts.localsName, escapeFn, include, rethrow`都是参数，`src`是执行的代码，`fn`函数如下:
```js
function (locals, escapeFn, include, rethrow) {
  var __line = 1
    , __lines = "<h2><%= user.name %></h2>"
    , __filename = undefined;
  try {
    var __output = "";
    function __append(s) { if (s !== undefined && s !== null) __output += s }
    with (locals || {}) {
      ; __append("<h2>")
      ; __append(escapeFn( user.name ))
      ; __append("</h2>")
    }
    return __output;
  } catch (e) {
    rethrow(e, __lines, __filename, __line, escapeFn);
  }
}
```
#### generateRenderFn
```js
function generateRenderFn() {
  const renderFn = (data) => {
    fn.apply(null, [data, escapeFn, include, rethrow]) // 执行通过`new Function`执行的函数
  }
  return renderFn
}

// 示例
const template = ejs.compile(str) // 这里的template函数就是renderFn函数
const result = template(data) // 传入数据，生成最后的代码
```
其中`escapeFn`、`include`、`rethrow`都是`ejs`内部实现的函数，在`renderFn`执行的时候会自己传入，这里的`data`就是传入的数据。

`renderFn`函数如下：
```js
function renderFn (data) {
  function fn (locals, escapeFn, include, rethrow) {
    // locals就是传入的data数据
    var __line = 1
      , __lines = "<h2><%= user.name %></h2>"
      , __filename = undefined;
    try {
      var __output = "";
      function __append(s) { if (s !== undefined && s !== null) __output += s }
      with (locals || {}) {
        ; __append("<h2>")
        ; __append(escapeFn( user.name ))
        ; __append("</h2>")
      }
      return __output;
    } catch (e) {
      rethrow(e, __lines, __filename, __line, escapeFn);
    }
  }
  fn.apply(null, [data, escapeFn, include, rethrow])
}
```
## 总结
- `new Template`生成一个`Template`
- 将传入的字符串`str`进行解析，生成代码字符串`source`
- 通过`new Function`生成可执行函数`fn`
- 将`fn`用`function`包裹起来，并设置参数为`data`，生成`renderFn`
- 传入`data`数据，完成模版渲染
  - 在代码执行过程中，利用`with(data)`语句的特性，大大减少代码量，不过此操作也比较好性能，且语义不明





