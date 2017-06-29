const express = require('express');
const Http = require('http');
const BodyParser = require('body-parser');
const rpio = require('rpio');
const ENV = require('./env.js');

let app = express();

// set lock's pin. Default is lock
rpio.open(ENV.PIN, rpio.OUTPUT, rpio.LOW);

app.use(BodyParser.urlencoded({ extended: false }));
app.use( BodyParser.json() );

// switch lock status
app.post('/switch', (request, response) => {
  const status = rpio.read(ENV.PIN);
  let res = 'yet';
  let token = request.body.token;
  let isToken = false;
  for (keyIndex in ENV.TOKENS) {
    console.log(ENV.TOKENS[keyIndex]);
    if (token === ENV.TOKENS[keyIndex]) {
      isToken = true;
      break;
    }
  }
  
  if (!isToken) {
    res = 'error';
    return response.status(400).send(JSON.stringify(res));
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

// get status
app.get('/status', (req, res) => {
  const status = rpio.read(ENV.PIN);
  let msg = null;
  if (status) {
    msg = "MOLi is close now Φ౪Φ."
  } else {
    msg = "MOLi is open now (=^-ω-^=)."
  }
  return res.status(200).json({
    status: status,
    message: msg
  });
});

app.listen(ENV.PORT, () => {
  console.log('API Server is running!');
});

