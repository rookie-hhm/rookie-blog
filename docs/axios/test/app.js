const Koa = require('koa');
const app = new Koa();
const cors = require('koa-cors')
const Router = require('koa-router')
var router = new Router();

const sleep = time => {
  return new Promise(resolve => {
    setTimeout(resolve, time)
  })
}
// response
router.get('/api', async ctx => {
  console.log('222')
  await sleep(5000)
  // setTimeout(() => {
  //   ctx.body = '23232'
  // }, 4000)
  ctx.body = '2323'
})

app.use(cors())
  .use(router.routes())
  .use(router.allowedMethods());


app.listen(3000, port => {
  console.log('listen on 3000')
});