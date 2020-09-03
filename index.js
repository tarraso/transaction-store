const Koa = require('koa');
const mongo = require('koa-mongo');
const jwt = require('koa-jwt');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-joi-router');

const users = require('./users.js');
const transactions = require('./transactions.js');
const { SwaggerAPI } = require('koa-joi-router-docs')


const app = module.exports = new Koa();

const secret = process.env.JWT_SECRET || 'jwt_secret';
app.context.secret = secret

app.use(bodyParser());
app.use(jwt({secret}).unless({ path: [/^\/users/, /^\/apiDocs/] }));

app.use(mongo({
    db: 'transactions'
}));

app.use(users.middleware());

app.use(transactions.middleware());


let swaggerAPI = new SwaggerAPI();
swaggerAPI.addJoiRouter(users);
swaggerAPI.addJoiRouter(transactions);

let spec = swaggerAPI.generateSpec({
    info: {
      title: 'Trancactions spec API',
      description: 'API for creating and receiving transactions',
      version: '0.1'
    },
    basePath: '/'
  });

let swaggerRouter = Router();
swaggerRouter.prefix('/apiDocs');
swaggerRouter.get('/_api.json', async ctx => {
    ctx.body = JSON.stringify(spec, null, '  ')
});

swaggerRouter.get('/', async ctx => {
    ctx.body = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>Example API</title>
    </head>
    <body>
        <redoc spec-url='/apiDocs/_api.json' lazy-rendering></redoc>
        <script src="https://rebilly.github.io/ReDoc/releases/latest/redoc.min.js"></script>
    </body>
    </html>
    `
});

app.use(swaggerRouter.middleware());

app.listen(3000);
