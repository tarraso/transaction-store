const Router = require('koa-joi-router');
const Joi = Router.Joi;

const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');

router = Router();
router.prefix('/users');

const ALLOWED_CURRENCIES = ['AUD', 'GBP', 'BYR', 'DKK', 'USD', 'EUR', 'ISK', 'KZT', 'RUB']

router.route({
  method: 'post',
  path: '/',
  meta: {
    swagger: {
      summary: 'User sign up',
      description: 'Creates user with specified nickname, password and currency',
      tags: ['users']
    }
  },
  validate: {
    body: {
      nickname: Joi.string().max(100),
      password: Joi.string().max(100),
      currency: Joi.string().valid(ALLOWED_CURRENCIES)
    },
    type: 'form',
    output: {
      200: {
        body: {
          nickname: Joi.string().max(100),
          currency: Joi.string().max(3),
          _id: Joi.string()
        },
      }
    }
  },
  handler: async (ctx) => {
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
        error: 'incorrect currency code'
      }
    }

    const password = await bcrypt.hash(ctx.request.body.password, 5);
    const user = (await ctx.db.collection('users').insertOne({nickname, password, currency})).ops[0];
    ctx.response.body = {
      _id: user._id,
      nickname: user.nickname,
      currency
    };
  }
});

router.route({
  meta: {
    swagger: {
      summary: 'User login',
      description: 'Provides Bearer token for specified username and password',
      tags: ['users']
    }
  },
  method: 'post',
  path: '/login',
  validate: {
    body: {
      nickname: Joi.string().max(100),
      password: Joi.string().max(100),
    },
    type: 'form',
    output: {
      200: {
        body: {
          token: Joi.string()
        },
      }
    }
  },
  handler:  async(ctx, next) => {
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
  }
});

module.exports = router;