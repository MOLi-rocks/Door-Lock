const express = require('express');
const Http = require('http');
const BodyParser = require('body-parser');
const rpio = require('rpio');
const ENV = require('./env.js');
const req = require('request');
const moment = require('moment');

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
  let message = request.body.message;
  let tokenTitle;

  for (TOKEN of ENV.TOKENS) {
    if (token === TOKEN.token) {
      token.Title = TOKEN.title;
      isToken = true;
      break;
    }
  }
  
  if (!isToken) {
    res = 'error';
    return response.status(400).send(JSON.stringify(res));
  }
  
  let act;

  if (status === rpio.HIGH) {
    rpio.write(ENV.PIN, rpio.LOW);
    res = 'Open';
    act = ' 開門';

  } else {
    rpio.write(ENV.PIN, rpio.HIGH);
    res = 'Close';
    act = ' 關門';
  }
  
  console.log(act); 
  req.post({
    url: ENV.messageURL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: ENV.botTOKEN
    },
    body:JSON.stringify({
      chat_id: ENV.chat_id,
      text: `${message}${act}\n${moment().format('YYYY/MM/DD HH:mm:ss')}`,
    })
  });

  req.get(ENV.adjustCameraURL, function(error, res, body) {
    //console.log(res);

    req.post({
      url: ENV.photosURL,
      headers: {
        'Content-Type': 'application/json',
        Authorization: ENV.botTOKEN
      },
      body:JSON.stringify({
        chat_id: ENV.chat_id,
        photo: ENV.getCameraURL,
        disable_notification: true
      })
    }, function(error, res, body) {
      //console.log(res);
    });
  });
  response.set({
    'Content-Type': 'application/json; charset=utf-8'
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

