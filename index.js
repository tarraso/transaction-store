const Koa = require('koa');
const mongo = require('koa-mongo');
const jwt = require('koa-jwt');
const bodyParser = require('koa-bodyparser');

const users = require('./users.js');
const transactions = require('./transactions.js');

const app = module.exports = new Koa();

const secret = process.env.JWT_SECRET || 'jwt_secret';
app.context.secret = secret

app.use(bodyParser());
app.use(jwt({secret}).unless({ path: [/^\/users/] }));

app.use(mongo({
    db: 'transactions'
}));

app.use(users.routes())
    .use(users.allowedMethods());


app.use(transactions.routes())
    .use(users.allowedMethods());

app.listen(3000);
