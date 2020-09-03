const Router = require('koa-joi-router');
const Joi = Router.Joi;

const {Converter} =  require('./converter');

const converter = new Converter();

router = Router();
router.prefix('/transactions');


router
  .get('/',
  {
    meta: {
      swagger: {
        summary: 'Transactions',
        description: `Allows receive all users's transactions
        Supports query params:
        - offset - offset from the beginning for pagination
        - limit - amoutn of transaction in one response
        - order - ascending or descening order by date (1 or -1)`,
        tags: ['transactions']
      }
    },
    handler: async(ctx, next) => {
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
      let transactions_query = ctx.db.collection('transactions')
                                      .find({'user_id':ctx.state.user.data._id})
                                      .sort({'date': order});
      let total = await transactions_query.count();                           
      let transactions = await transactions_query
                                      .skip(offset)
                                      .limit(limit)
                                      .toArray();
      
      const currency = ctx.state.user.data.currency;
      for (let i = 0; i < transactions.length; i++) {
        const trasaction = transactions[i];
        trasaction.amount = converter.convert(trasaction.amount, currency)
      }
      ctx.body = {
        limit,
        offset,
        total,
        data: transactions
      }
      next();
    }
  });
  


router.get('/total',{
  meta: {
    swagger: {
      summary: 'Total ammount',
      description: 'Total amount of money in roubles after all transactions',
      tags: ['transactions']
    }
  },
  handler: async(ctx, next) => {
    let totalIncomeTransactionsAmount = (await ctx.db.collection('transactions')
    .find({'user_id':ctx.state.user.id, 'type': 'income'})
    .toArray()).map((e)=> e.amount).reduce((a,b)=> a+b,0);
    let totalExpenseTransactionsAmount = (await ctx.db.collection('transactions')
    .find({'user_id':ctx.state.user.id, 'type': 'expense'})
    .toArray()).map((e)=> e.amount).reduce((a,b)=> a+b,0);
    let totalAmount = totalIncomeTransactionsAmount-totalExpenseTransactionsAmount;
    totalAmount = converter.convert(totalAmount, ctx.state.user.data.currency);
    ctx.body = {
      totalAmount
    }
    next();
  }
});

 router.route({
  method: 'post',
  path: '/',
  meta: {
    swagger: {
      summary: 'Create transaction',
      description: 'Creates specified transaction for current user',
      tags: ['transactions']
    }
  },
  validate: {
    body: {
      amount: Joi.number().greater(0),
      type: Joi.string().valid('income', 'expense')
    },
    type: 'form',
    output: {
      200: {
        body: {
          amount: Joi.number().greater(0),
          type: Joi.string().valid('income', 'expense'),
          user_id: Joi.string(),
        }
      }
    }
  },
  handler: async(ctx, next) => {
    const user = ctx.state.user.data;
    const transaction = {
      user_id: user._id,
      amount: ctx.request.body.amount,
      type: ctx.request.body.type,
      date: new Date(Date.now()).toISOString()
    };
    ctx.body = (await ctx.db.collection('transactions').insertOne(transaction)).ops[0];
    next();
  }
});

module.exports = router;

