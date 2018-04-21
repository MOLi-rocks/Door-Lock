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

  // send message, adjust camera to door then reply message with camrea photo, if error will throw back information
  // devMode = true, will send full error message
  controller.sendMessage(`${resultObject.message}${resultObject.action}\n${moment().format('YYYY/MM/DD HH:mm:ss')}`).then( messageBody => {
    return controller.adjustCamera(messageBody);
  }).then( messageBody => {
    return controller.replyMessage(messageBody);
  }).then( success => {
    console.log(suceess);
  }).catch( error => {
    console.log(error);
    response.set({
      'Content-Type': 'application/json; charset=utf-8'
    });
    return response.status(200).send(JSON.stringify(resultObject.action));
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

// reset gpio when terminated
process.on('SIGINT', function(){
  controller.gpioCleanup(ENV.PINS);
  process.exit();
});

app.listen(ENV.PORT, () => {
  console.log('API Server is running!');
});
