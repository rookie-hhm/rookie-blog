import{_ as s,c as a,o as n,a as l}from"./app.9d007d2b.js";const d=JSON.parse('{"title":"","description":"","frontmatter":{},"headers":[{"level":2,"title":"项目目录结构","slug":"项目目录结构","link":"#项目目录结构","children":[]},{"level":2,"title":"工作流程图","slug":"工作流程图","link":"#工作流程图","children":[]}],"relativePath":"front-end-utils/axios/start.md"}'),p={name:"front-end-utils/axios/start.md"},o=l(`<p><a href="https://axios-http.com/" target="_blank" rel="noreferrer">Axios</a>，相信做前端的都知道这个非常知名的库，用于实现前后端通讯的HTTP请求库，话不多说，接下来我们一起解析Axios的特性。</p><p><a href="https://github.com/axios/axios" target="_blank" rel="noreferrer">源码仓库点这里</a></p><div class="tip custom-block"><p class="custom-block-title">TIP</p><p>当前我们阅读源码的版本是<code>1.2.1</code></p></div><h2 id="项目目录结构" tabindex="-1">项目目录结构 <a class="header-anchor" href="#项目目录结构" aria-hidden="true">#</a></h2><p><strong>只挑几个重点目录进行展示，让大家对<code>axios</code>项目整体有个认知，对其他目录文件有兴趣的同学可以自行阅读</strong></p><div class="language-js line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki material-theme-palenight" tabindex="0"><code><span class="line"><span style="color:#89DDFF;">|</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">-</span><span style="color:#A6ACCD;"> dist </span><span style="color:#676E95;font-style:italic;">// 打包后生成的文件</span></span>
<span class="line"><span style="color:#89DDFF;">|</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">-</span><span style="color:#A6ACCD;"> rollup</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">config</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">js </span><span style="color:#676E95;font-style:italic;">// 打包文件 生成各种格式的文件</span></span>
<span class="line"><span style="color:#89DDFF;">|</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">-</span><span style="color:#A6ACCD;"> examples </span><span style="color:#676E95;font-style:italic;">// 相当于一个playground, 可以在实例代码里打上断点，方便调试</span></span>
<span class="line"><span style="color:#89DDFF;">|</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">-</span><span style="color:#A6ACCD;"> lib </span><span style="color:#676E95;font-style:italic;">// 核心方法的实现</span></span>
<span class="line"><span style="color:#A6ACCD;">  </span><span style="color:#89DDFF;">|</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">-</span><span style="color:#A6ACCD;"> adapters </span><span style="color:#676E95;font-style:italic;">// 适配器，适配node环境和浏览器环境</span></span>
<span class="line"><span style="color:#A6ACCD;">  </span><span style="color:#89DDFF;">|</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">-</span><span style="color:#A6ACCD;"> cancel </span><span style="color:#676E95;font-style:italic;">// 取消请求的方法</span></span>
<span class="line"><span style="color:#A6ACCD;">  </span><span style="color:#89DDFF;">|</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">-</span><span style="color:#A6ACCD;"> core </span><span style="color:#676E95;font-style:italic;">// 请求实现的核心方法</span></span>
<span class="line"><span style="color:#A6ACCD;">  </span><span style="color:#89DDFF;">|</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">-</span><span style="color:#A6ACCD;"> defaults </span><span style="color:#676E95;font-style:italic;">// 请求的默认配置</span></span>
<span class="line"><span style="color:#A6ACCD;">  </span><span style="color:#89DDFF;">|</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">-</span><span style="color:#A6ACCD;"> helpers </span><span style="color:#676E95;font-style:italic;">// 工具方法</span></span>
<span class="line"><span style="color:#A6ACCD;">  </span><span style="color:#89DDFF;">|</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">-</span><span style="color:#A6ACCD;"> platform </span><span style="color:#676E95;font-style:italic;">// 定义了平台相关的属性</span></span>
<span class="line"><span style="color:#A6ACCD;">  </span><span style="color:#89DDFF;">|</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">-</span><span style="color:#A6ACCD;"> axios </span><span style="color:#676E95;font-style:italic;">// 外层index.js 引入的入口文件</span></span>
<span class="line"><span style="color:#A6ACCD;">  </span><span style="color:#89DDFF;">|</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">-</span><span style="color:#A6ACCD;"> utils </span><span style="color:#676E95;font-style:italic;">// 工具方法</span></span>
<span class="line"><span style="color:#89DDFF;">|</span><span style="color:#A6ACCD;"> </span><span style="color:#89DDFF;">-</span><span style="color:#A6ACCD;"> index</span><span style="color:#89DDFF;">.</span><span style="color:#A6ACCD;">js </span><span style="color:#676E95;font-style:italic;">// axios入口文件</span></span>
<span class="line"></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br></div></div><h2 id="工作流程图" tabindex="-1">工作流程图 <a class="header-anchor" href="#工作流程图" aria-hidden="true">#</a></h2><p><img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6329104a68a0424c92723f6d16d8fd74~tplv-k3u1fbpfcp-zoom-in-crop-mark:3024:0:0:0.awebp" alt="流程图"></p><p>可以看到<code>Axios</code>的核心工作流程如下:</p><ul><li>首先从客户端发出一个请求之前，接着用户自定义的<code>请求拦截器</code>会对请求层层拦截并进行处理(<strong>这阶段主要处理的是请求配置信息</strong>)，接着通过<code>请求转换器</code>的处理(这个阶段可以处理请求的数据与请求头)，最后发出请求。</li><li>请求从服务端会的时候，首先会通过<code>相应转换器</code>的处理(这个阶段也一样，可以处理相应数据与响应头部)，接着再经过<code>相应拦截器</code>(主要处理相应配置)的层层拦截处理，最后得到想要的响应信息</li></ul><p>好的，我们现在对<code>Axios</code>有了一个整体认识，接下来我们深入源码内部细节，一步步剖析是如何实现的。</p>`,11),e=[o];function t(c,r,i,D,y,A){return n(),a("div",null,e)}const F=s(p,[["render",t]]);export{d as __pageData,F as default};
