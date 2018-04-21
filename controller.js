const rpio = require('rpio');
const ENV = require('./env.json');

/* GPIO functions */

// initialization gpio
function gpioInit(ENV_PINS) {
    /****
        PULL_DOWN = When pin connect with empty will get 0. if you don't use this, the
                    pin will get 0 or 1 in random.
        PULL_UP   = When pin connect with empty will get 1.
    ****/

    // set lock's pin. Default is unlock
    rpio.open(ENV_PINS.relay, rpio.OUTPUT, rpio.LOW);
    // set state's pin. When door close, the pin will get HIGH.
    rpio.open(ENV_PINS.state, rpio.INPUT, rpio.PULL_DOWN);
}

// read gpio
function gpioRead(PIN) {
    return rpio.read(PIN);
}

// switch gpio state and return action/method/message object
function gpioSwitch(PIN, tokenTitle, message) {
    // read PIN state and can't change
    const readPIN = rpio.read(PIN);
    // action = close/open, method by rfid/button/app
    let resultObject = {
        "action": undefined,
        "method": undefined,
        "message": undefined
    };

    if (readPIN === rpio.HIGH) {
        // Close relay
        rpio.write(PIN, rpio.LOW);
        resultObject.action = '開門';
    } else {
        // Open relay
        rpio.write(PIN, rpio.HIGH);
        resultObject.action = '關門';
    }
    // add method and message to object
    resultObject.method = tokenTitle;
    resultObject.message = message;

    return resultObject;
}

// bind event for wait door really close
function gpioBindEvent(PIN) {
    rpio.poll(PIN, gpioDetectClose, rpio.POLL_HIGH);
}

// send message then clean the event
function gpioDetectClose(PIN) {

    // clean the event after send message
    // rpio.poll(PIN, null);
}

function gpioCleanup(ENV_PINS) {
    for(PIN of Object.values(ENV_PINS)) {
        rpio.close(PIN);
      }
      console.log('All gpio cleanup');
}

/* API method */

// send door state message to telegram
function sendMessage(message) {
    return new Promise((resolve, reject) => {
        req.post({
            url: ENV.messageURL,
            headers: {
              'Content-Type': 'application/json',
              Authorization: ENV.botTOKEN
            },
            body: JSON.stringify({
              chat_id: ENV.chat_id,
              text: message,
            })
          }, function (error, response, messageBody) {
              if(errpr) {
                reject(ENV.devMode === true ? console.log(err) : console.log('Telegram bot error'));
              }
              resolve(messageBody);
          });
    });
}

// adjust camera
function adjustCamera(messageBody) {
    return new Promise((resolve, reject) => {
        req.get(ENV.adjustCameraURL, function (error, response, body) {
            if(error) {
                reject(ENV.devMode === true ? console.log(err) : console.log('Adjust camera error'));
            }
            resolve(messageBody);
        });
    });
}

// reply message with a photo
function replyMessage(messageBody) {
    return new Promise((resolve, reject) => {
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
        }, function (error, response, body) {
            if(error) {
                reject(ENV.devMode === true ? console.log(err) : console.log('Reply message error'));
            }
            resolve(ENV.devMode === true ? console.log(err) : console.log('Reply message success'));
        });
    });
}


module.exports = {
    gpioInit,
    gpioRead,
    gpioSwitch,
    gpioCleanup,
    sendMessage,
    adjustCamera,
    replyMessage
};
