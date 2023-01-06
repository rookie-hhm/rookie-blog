:::tip
本次我们来分析下[lodash](https://github.com/lodash/lodash/)库的主线流程源码，主要理清大体流程，具体的分支和相关的函数方法，可以在用到的时候去查看。
:::

### 准备工作
本文分析的是打包之后生成代码`lodash-es`，官方仓库的代码是拆分后的代码，并不是打包后生成的代码，我们可以通过`npm`直接下载`lodash-es`直接获取源码，也可以通过`lodash-cli`脚手架来生成打包对应格式及版本的代码。流程如下:(以MacOS为例)
- 全局安装`lodash-cli`
```bash
npm i -g lodash-cli
```
- 下载完之后，我们可以通过`npm config get prefix`命令获取全局npm目录，然后在该目录下的`lib/node_modules`里找到`lodash-cli`
- 用代码编辑器打开该项目，默认情况在`package.json`中安装的`lodash`版本是`4.17.5`，如果需要生成对应的lodash包修改版本后,重新安装依赖包
- `lodash modularize exports=es -o ./`执行该命令就可以在当前目录下生成`ESModule`模块的`lodash`，你也可以自行定义生成文件的目录，(参考链接)[]

::: tip
代码打包生成的功能代码在`bin/lodash`文件中，其中打包的`lodash`就依赖于`package.json`中`lodash`的版本
:::

