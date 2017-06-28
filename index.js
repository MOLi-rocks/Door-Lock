var Http = require('http');
var Router = require('router');
var BodyParser = require('body-parser');
var rpio = require('rpio');
const ENV = require('./env.js');

let router = new Router();

// set lock's pin. Default is lock
rpio.open(ENV.PIN, rpio.OUTPUT, rpio.HIGH);

router.use( BodyParser.json() );

// unlock
router.post('/open', function (request, response) {

  rpio.write(ENV.PIN, rpio.LOW);

  response.writeHead( 200, {
    'Content-Type' : 'application/json; charset=utf-8'
  });
  response.end( JSON.stringify('Open') );

});

// lock
router.post('/close', function (request, response) {

  rpio.write(ENV.PIN, rpio.HIGH);

  response.writeHead( 200, {
    'Content-Type' : 'application/json; charset=utf-8'
  });
  response.end( JSON.stringify('Close') );

});

// switch lock status
router.post('/switch', function (request, response) {
  const status = rpio.read(ENV.PIN);
  let res = 'yet';

  if (status === rpio.HIGH) {
    rpio.write(ENV.PIN, rpio.LOW);
    res = 'Open';

  } else {
    rpio.write(ENV.PIN, rpio.HIGH);
    res = 'Close';
  }

  response.writeHead( 200, {
    'Content-Type' : 'application/json; charset=utf-8'
  });
  response.end( JSON.stringify(res) );

});

// set api server
const server = Http.createServer(function(request, response) {
  router( request, response, function( error ) {
    if ( !error ) {
      response.writeHead( 404 );
    } else {
      // Handle errors
      console.log( error.message, error.stack );
      response.writeHead( 400 );
    }
    response.end( 'API Server is running!' );
  });
})

server.listen(ENV.PORT);
