const Router = require('koa-router');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');


const router = Router({
  prefix: '/users'
});

const ALLOWED_CURRENCIES = ['AUD', 'GBP', 'BYR', 'DKK', 'USD', 'EUR', 'ISK', 'KZT', 'RUB']
router
  .post('/', async(ctx, next) => {
    
    const nickname = ctx.request.body.nickname;
    const users = await ctx.db.collection('users').find({nickname:nickname}).toArray();

    if (!ctx.request.body) {
      ctx.response
    }
    if (users.length > 0 ) {
      ctx.status = 401;
      ctx.response.body = {
        error: 'User ' + nickname + ' already exists.'
      }
      return;
    }
    const currency = ctx.request.body.currency;
    if (ALLOWED_CURRENCIES.indexOf(currency) == -1 ){
      ctx.status = 401;
      ctx.response.body = {
        error: 'Invalid currency'
      }
    }

    const password = await bcrypt.hash(ctx.request.body.password, 5);
    const user = (await ctx.db.collection('users').insertOne({nickname, password, currency})).ops[0];
    ctx.response.body = {
      id: user._id,
      nickname: user.nickname,
      currency
    };
    next();
  })
  .post('/login', async(ctx, next) => {
    const user = await ctx.db.collection('users').findOne({nickname:ctx.request.body.nickname});
    if (!user) {
      ctx.status = 401;
      ctx.body = {
        error: "User doesn't exist"
      }
      return;
    }
    const {
      password,
      ...userInfoWithoutPassword
    } = user;
    if (bcrypt.compare(ctx.request.body.password, password)) {
      ctx.body = {
        token: jsonwebtoken.sign({
          data: userInfoWithoutPassword,
        }, ctx.secret)
      }
      next();
    } else {
      ctx.status = 401;
      ctx.body = {
        error: "Wrong password"
      }
      return;
    }
  });

module.exports = router;