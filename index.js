const express = require('express');
const Http = require('http');
const BodyParser = require('body-parser');
const ENV = require('./env.json');
const req = require('request');
const moment = require('moment');
const middleware = require('./middleware');
const controller = require('./controller');

let app = express();

app.use(BodyParser.urlencoded({
  extended: false
}));
app.use(BodyParser.json());

/* GPIO setup */
controller.gpioInit(ENV.PINS);

/* API */
// switch lock status
app.post('/switch', middleware.verifyToken, (request, response) => {
  // switch relay and return action/method/message
  let resultObject = controller.gpioSwitch(ENV.PINS.relay, request.tokenTitle, request.body.message);

  req.post({
    url: ENV.messageURL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: ENV.botTOKEN
    },
    body: JSON.stringify({
      chat_id: ENV.chat_id,
      text: `${resultObject.message}${resultObject.action}\n${moment().format('YYYY/MM/DD HH:mm:ss')}`,
    })
  }, function (err, httpResponse, messageBody) {
    req.get(ENV.adjustCameraURL, function (error, res, body) {
      messageBody = JSON.parse(messageBody);
      req.post({
        url: ENV.photosURL,
        headers: {
          'Content-Type': 'application/json',
          Authorization: ENV.botTOKEN
        },
        body: JSON.stringify({
          chat_id: ENV.chat_id,
          photo: ENV.getCameraURL,
          disable_notification: true,
          reply_to_message_id: messageBody.message_id
        })
      }, function (error, res, body) {
        console.log(body);
      });
    });
    response.set({
      'Content-Type': 'application/json; charset=utf-8'
    });
    response.status(200).send(JSON.stringify(resultObject.action));
  });
});

// get status
app.get('/status', (req, res) => {
  let responseObject = {
    "status": controller.gpioRead(ENV.PINS.state),
    "message": undefined
  };
  // add message to describe door status
  responseObject.message = ( responseObject.status ? "MOLi is close now.（ˊ_>ˋ ）/ " : "MOLi is open now. (=^-ω-^=) / ");
  // add message to tell user if door may lock
  responseObject.message += ( controller.gpioRead(ENV.PINS.relay) ? "門鎖通電" : "門鎖未通電");

  return res.status(200).send(responseObject);
});

process.on('SIGINT', function(){
  controller.gpioCleanup(ENV.PINS);
  process.exit();
});

app.listen(ENV.PORT, () => {
  console.log('API Server is running!');
});
