const express = require('express');
const bodyParser = require('body-parser');
const rpio = require('rpio');
const ENV = require('./env.js');

let app = express();

// set lock's pin. Default is lock
rpio.open(ENV.PIN, rpio.OUTPUT, rpio.HIGH);

app.use(bodyParser.urlencoded());
app.use( bodyParser.json() );

// switch lock status
app.post('/switch', (request, response) => {
  const status = rpio.read(ENV.PIN);
  let res = 'yet';
 
  let token = request.body.token;
  let isToken = false;
 
  for (keyIndex in ENV.TOKENS) {
    if (token === ENV.TOKENS[keyIndex]) {
      isToken = true;
      break;
    }
  }
  
  if (!isToken) {
    res = 'error';
    return response.status(404).send(JSON.stringify(res));
  }

  if (status === rpio.HIGH) {
    rpio.write(ENV.PIN, rpio.LOW);
    res = 'Open';

  } else {
    rpio.write(ENV.PIN, rpio.HIGH);
    res = 'Close';
  }

  response.set({
    'Content-Type' : 'application/json; charset=utf-8'
  });
  response.status(200).send(JSON.stringify(res));

});

app.listen(ENV.PORT, () => {
  console.log('API Server is running!');
});

