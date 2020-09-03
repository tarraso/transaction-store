const Router = require('koa-router');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');


const router = Router({
  prefix: '/users'
});


router
  .post('/', async(ctx, next) => {
    
    // TODO add extra validation
    const nickname = ctx.request.body.nickname;
    const users = await ctx.db.collection('users').find({nickname:nickname}).toArray();
 
    if (!ctx.request.body) {
      ctx.response
    }
    if (users.length > 0 ) {
      ctx.response.body = {
        error: 'User ' + nickname + ' already exists.'
      }
      
      return;
    }

    const password = await bcrypt.hash(ctx.request.body.password, 5);
    const user = (await ctx.db.collection('users').insertOne({nickname, password})).ops[0];
    ctx.response.body = {
      id: user._id,
      nickname: user.nickname
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