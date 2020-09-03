const Router = require('koa-router');
const router = Router({
  prefix: '/transactions'
});


router
  .get('/', async(ctx, next) => {
    let order = (ctx.request.query.order);
    if (order){
      order = parseInt(order);
    } else {
      order = 1;
    }
    let offset = ctx.request.query.offset;
    if (offset){
      offset = parseInt(offset);
    } else {
      offset = 0;
    }
    let limit = ctx.request.query.limit;
    if (offset){
      limit = parseInt(limit);
    } else {
      limit = 10;
    }
    let transactions = await ctx.db.collection('transactions')
                                    .find({'user_id':ctx.state.user.data._id})
                                    .sort({'date': order})
                                    .skip(offset)
                                    .limit(limit)
                                    .toArray();
    ctx.body = transactions;
    next();
  })
  .get('/total', async(ctx, next) => {
    let totalIncomeTransactionsAmount = (await ctx.db.collection('transactions')
    .find({'user_id':ctx.state.user.id, 'type': 'income'})
    .toArray()).map((e)=> e.amount).reduce((a,b)=> a+b,0);
    let totalExpenseTransactionsAmount = (await ctx.db.collection('transactions')
    .find({'user_id':ctx.state.user.id, 'type': 'expense'})
    .toArray()).map((e)=> e.amount).reduce((a,b)=> a+b,0);
    let totalAmount = totalIncomeTransactionsAmount-totalExpenseTransactionsAmount;
    ctx.body = {
      amount: totalAmount
    }
    next();
  })
  .post('/', async(ctx, next) => {
    const user = ctx.state.user.data;
    const transaction = {
      user_id: user._id,
      amount: ctx.request.body.amount,
      type: ctx.request.body.type,
      date: new Date(Date.now()).toISOString()
    };
    if (transaction.type != 'income' && transaction.type != 'expense') {
      ctx.status = 401;
      ctx.body = {
        'error': 'Wrong transaction type'
      };
    };
    ctx.body = (await ctx.db.collection('transactions').insertOne(transaction)).ops[0];
    next();
  });

module.exports = router;

