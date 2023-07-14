const fastify = require('fastify')({
  logger: true // This line enables logging
})

const cron = require ('node-cron');
const refreshData = require('./refresh');

const path = require('path');

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public'), // 'public' should be the directory where your index.html file is
  prefix: '/', // optional: default '/'
})

fastify.get('/', function (req, reply) {
  return reply.sendFile('index.html') // serving path.join(__dirname, 'public', 'index.html') directly
})

// fastify.get('/:stuff', function (req, reply) {
//   return '<html><body><h1>Hello there ${req.params.stuff}!</h1></body></html>';
// })

fastify.get('/refresh', async (req, reply) => {
  refreshData();
  reply.send({ status: 'Data refresh initiated' });
});

const start = async () => {
  try {
    await fastify.listen({ port: 80, host: '0.0.0.0' })
    fastify.log.info(`server listening on ${fastify.server.address().port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()

cron.schedule('0 * * * *', refreshData);
