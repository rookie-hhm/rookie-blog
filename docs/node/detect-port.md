[`detect-port`](https://www.npmjs.com/package/detect-port)是用来检查端口占用的工具库，如果端口被占用了，会智能地提示下一个没被占用的端口号。这个库在很多脚手架中都应用了

## 基本用法
```js
const detect = require('detect-port');
const Koa = require('koa')
const app  = new Koa()
const port = 3000
// 监听3000端口
app.listen(port, () => {
  console.log('开启监听')
})

// 检测3000端口是否被占用
detect(port)
  .then(_port => {
    console.log(_port, '_port')
    if (port == _port) {
      console.log(`port: ${port} was not occupied`);
    } else {
      console.log(`port: ${port} was occupied, try port: ${_port}`);
    }
  })
  .catch(err => {
    console.log(err);
  });
```
在当前例子中，因为两个程序都同时监听了`port`，所以会输出`port: 3000 was occupied, try port: 3001`，3001是通过detect-port`新得出的port

## 源码分析
通过上面的实例代码，通过在`detect(port)`代码处打断点进入到源码中。[调试技巧](https://juejin.cn/post/7035954397012033566)
```js
const net = require('net') // 网络模块
module.exports = (port, callback) => {
  let hostname = '';

  // ..省略代码

  // 检查port没传值，默认会给0
  port = parseInt(port) || 0;
  // 默认能够检查的端口： 当前端口号 + 10，且最大值为65535
  let maxPort = port + 10;
  if (maxPort > 65535) {
    maxPort = 65535;
  }
  // .. 省略代码
  // promise
  return new Promise(resolve => {
    tryListen(port, maxPort, hostname, (_, realPort) => {
      resolve(realPort);
    });
  });
};
```
做端口监听处理的逻辑在`tryListen`方法中
### tryListen
```js
function tryListen(port, maxPort, hostname, callback) {
  // 错误处理函数
  function handleError() {
    // 当前端口号加一
    port++;
    if (port >= maxPort) {
      port = 0;
      maxPort = 0;
    }
    // 重新调用tryListen函数，处理端口号
    tryListen(port, maxPort, hostname, callback);
  }

  if (hostname) { // 如果存在hostname有传入
    listen(port, hostname, (err, realPort) => {
      if (err) {
        if (err.code === 'EADDRNOTAVAIL') {
          return callback(new Error('the ip that is not unknown on the machine'));
        }
        return handleError();
      }

      callback(null, realPort);
    });
  } else {
    // 1. check null
    listen(port, null, (err, realPort) => {
      // ignore random listening
      if (port === 0) {
        return callback(err, realPort);
      }

      if (err) {
        return handleError(err);
      }

      // 2. check 0.0.0.0
      listen(port, '23', err => {
        if (err) {
          return handleError(err);
        }

        // 3. check localhost
        listen(port, 'localhost', err => {
          // if localhost refer to the ip that is not unkonwn on the machine, you will see the error EADDRNOTAVAIL
          // https://stackoverflow.com/questions/10809740/listen-eaddrnotavail-error-in-node-js
          if (err && err.code !== 'EADDRNOTAVAIL') {
            return handleError(err);
          }

          // 4. check current ip
          listen(port, address.ip(), (err, realPort) => {
            if (err) {
              return handleError(err);
            }

            callback(null, realPort);
          });
        });
      });
    });
  }
}
```
`tryListen`会依次对同一端口，不同`hostname`的场景执行`listen`进行判断端口是否可用
1. port null
2. port 0.0.0.0
3. port localhost
4. port ip(本地ip)

只有满足了所有条件，才会执行`callback`将结果返回出去，如果任一分支不满足就会执行`handlerError`函数

`handlerError`顾名思义就是错误处理函数，如果当前端口号没占用就会进入到此函数中，将端口号进行`+1`操作，接着再继续调用`tryListen`继续处理新的端口号。

### listen
```js
function listen(port, hostname, callback) {
  // 创建一个TCP服务
  const server = new net.Server();
  // 监听error
  server.on('error', err => {
    server.close();
    if (err.code === 'ENOTFOUND') { 
      // 如果当前机器上hostname没找到
      // 参考node常见的错误码地址
      // https://betterstack.com/community/guides/scaling-nodejs/nodejs-errors/
      debug('ignore dns ENOTFOUND error, get free %s:%s', hostname, port);
      return callback(null, port);
    }
    return callback(err);
  });
  // 监听传入的port 和 hostname
  server.listen(port, hostname, () => {
    port = server.address().port;
    server.close();
    return callback(null, port);
  });
}
```
- 创建一个`TCP`服务`Server`，通过`Server.listen`方法监听当前传入的`port`和`hostname`
- 如果当前端口没占用了或者无法找到主机名，就会触发`error`事件
  - 如果是主机名没有找到，执行`return callback(null, port)`，进入下一`hostname`的检查
  - 否则，执行`callback(err)`，接着就会触发`handlerError`
- 如果`Server.listen`没有问题就会执行`return callback(null, port)`，进入下一`hostname`的检查


## 总结
`detect-port`的核心实现是基于`net`模块创建TCP服务来检查端口是否可用，不可用则会将端口递增，逐步查找到没有被占用的端口，可用则直接返回当前端口