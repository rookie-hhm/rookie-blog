前端脚手架开发中，在执行耗时操作时，常常需要设置一些提示信息或者加载样式来优化体验，其中[`ora`](https://www.npmjs.com/package/ora)每周达到了惊人的上千万下载量，学习其中的实现方式能够帮助开发者更好地使用和理解，话不多说，我们开始今天的学习。

## 基本用法
```js
import ora from 'ora'
const spinner = ora('Loading unicorns').start();
setTimeout(() => {
	spinner.color = 'yellow';
	spinner.text = 'Loading rainbows';
}, 5000);

setTimeout(() => {
  spinner.stop()
}, 10000)
```
显示结果如下:

<video controls autoplay="autoplay">
<source src="./images/ora.mov">
</video>

特点:

- 能在loading过程中改变loading的样式与文案
- 在loading过程中，如果此时在终端进行输入，输入的文案不会加到`loading`后面而是会缓存起来，当loading结束后会显示在命令行中

我们带着这两个主要特点来理清`ora`执行的大致流程以及比较常用的方法。

## 执行流程分析
导出的函数代码如下：
```js
export default function ora(options) {
	return new Ora(options);
}
```
可以看到，最终是通过执行`new Ora`返回实例对象，所以我们重点看下`Ora`的实现
```js
class Ora {
  // ... 私有变量定义
  #options
  constructor(options) {
    // 关键部分，在loading过程中阻止输入
    if (!stdinDiscarder) {
      stdinDiscarder = new StdinDiscarder();
    }
    if (typeof options === 'string') {
      options = {
        text: options,
      };
    }
    this.#options = {
      color: 'cyan',
      stream: process.stderr,
      discardStdin: true,
      hideCursor: true,
      ...options,
    };
    this.color = this.#options.color;
    this.spinner = this.#options.spinner;
    this.text = this.#options.text;
    this.prefixText = this.#options.prefixText;
    this.indent = this.#options.indent;
    // .. 设置私有变量，比较多就不一一贴出来了
  }
}
```
`Ora`初始化部分主要做两件事情:
- 通过传入的参数设置内部的私有变量的值
- 其中关键功能，是通过`StdinDiscarder`方法，缓存在loading过程中的输入(在loading过程中的值，在loading结束之后才会写入到终端上)

### StdinDiscarder
```js
import process from 'node:process';
import readline from 'node:readline';
import {BufferListStream} from 'bl';
const ASCII_ETX_CODE = 0x03; // Ctrl+C emits this code
export class StdinDiscarder {
	#requests = 0;
	#mutedStream = new BufferListStream();
	#rl;
	constructor() {
		this.#mutedStream.pipe(process.stdout);
    // 把标准输出流放入到Buffer中缓存起来
	}
	start() {
		this.#requests++;
		if (this.#requests === 1) {
      // 开始进行监听行输入
			this._realStart();
		}
	}
	stop() {
		this.#requests--;
		if (this.#requests === 0) {
			this._realStop();
		}
	}
	_realStart() {
    // 开启一个readline实例
		this.#rl = readline.createInterface({
			input: process.stdin,
			output: this.#mutedStream,
		});
    // 当前监听到中断的信号, ctrl+c
		this.#rl.on('SIGINT', () => {
      // 如果当前进程监听该事件的监听数量为0
			if (process.listenerCount('SIGINT') === 0) {
				process.emit('SIGINT');
			} else {
        // 不为零 退出readline 杀死程序
				this.#rl.close();
				process.kill(process.pid, 'SIGINT');
			}
		});
	}
	_realStop() {
    // 关闭readline
		this.#rl.close();
		this.#rl = undefined;
	}
}
```
- `StdinDiscarder`初始化过程中，将`process.stdout`通过管道放入到了`BufferListStream`的缓存区(`mutedStream`)中
- 在`start`过程中会开启一个`readline`用来监听终端行输入的实例，输入是`process.stdin`(就是我们在命令行中输入的文案)，输出是`mutedStream`而不是`process.stdout`
所以，这个时候当我们在命令行中输入文案时，这些数据都会放入缓存区中，而不是直接显示在命令行中。关于[`BufferListStream`](https://www.npmjs.com/package/bl)的实现，感兴趣的可以看下。

### start
初始化`Ora`完成之后，执行`ora.start()`方法开启`loading`
```js
class Ora {
  // ....
  start(text) {
    if (text) {
      this.text = text;
    }
    if (this.#isSilent) { // 设置了静默模式，就不展示loading
      return this;
    }
    if (this.#options.hideCursor) { // 是否隐藏光标
      cliCursor.hide(this.#stream);
    }
    if (this.#options.discardStdin && process.stdin.isTTY) { // 判断是不是终端
      this.#isDiscardingStdin = true;
      // stdinDiscarder = new StdinDiscarder();
      stdinDiscarder.start(); // 创建一个readline实例，监听命令行输入
    }
    // 执行render开始渲染
    this.render();
    // 开启定时器，不断的渲染帧
    this.#id = setInterval(this.render.bind(this), this.interval);
    return this;
  }
}
```
`start`逻辑也比较清晰，`render`函数是真正实现`loading`效果的，其中`cliCursor`这个库可以实现命令行光标的展示和隐藏，我们在后续在看看相关源码。

### render
```js
render () { // 渲染loading样式
  if (this.#isSilent) { // 静默状态就直接返回
    return this;
  }
  this.clear(); // 清屏操作，把上一帧清空
  this.#stream.write(this.frame()); // 写入当前帧
  // process.stderr.write(this.frame())
  this.#linesToClear = this.#lineCount; // 需要清空的行数
  return this;
}

clear() { // 清屏操作
  this.#stream.cursorTo(0);
  for (let index = 0; index < this.#linesToClear; index++) {
    if (index > 0) {
      this.#stream.moveCursor(0, -1);
    }
    this.#stream.clearLine(1);
  }
  if (this.#indent || this.lastIndent !== this.#indent) {
    this.#stream.cursorTo(this.#indent);
  }
  this.lastIndent = this.#indent;
  this.#linesToClear = 0;

  return this;
}
```
