import Http from 'http';
import Router from 'router';
import BodyParser from 'body-parser';
import rpio from 'rpio';
import '../env.js';

let router = new Router();

rpio.open(process.env.PIN, rpio.OUTPUT, rpio.HIGH);
router.use( BodyParser.json() );

router.post('/open', function (request, response) {

  rpio.write(process.env.PIN, rpio.LOW);

  response.writeHead( 200, {
    'Content-Type' : 'application/json; charset=utf-8'
  });
  response.end( JSON.stringify('Open') );

});

router.post('/close', function (request, response) {

  rpio.write(process.env.PIN, rpio.HIGH);

  response.writeHead( 200, {
    'Content-Type' : 'application/json; charset=utf-8'
  });
  response.end( JSON.stringify('Close') );

});

const server = Http.createServer(function(request, response) {
  // router(req, res, finalhandler(req, res));
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

server.listen(process.env.PORT);
