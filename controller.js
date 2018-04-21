const rpio = require('rpio');
const request = require('request');
const ENV = require('./env.json');

/* GPIO functions */

// initialization gpio
function gpioInit() {
    /****
        PULL_DOWN = When pin connect with empty will get 0. if you don't use this, the
                    pin will get 0 or 1 in random.
        PULL_UP   = When pin connect with empty will get 1.
    ****/

    // set lock's pin. Default is unlock
    rpio.open(ENV.PINS.relay, rpio.OUTPUT, rpio.LOW);
    // set state's pin. When door close, the pin will get HIGH.
    rpio.open(ENV.PINS.state, rpio.INPUT, rpio.PULL_DOWN);
    // bind event to detect the door really close
    _gpioBindEvent(ENV.PINS.state);
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
function _gpioBindEvent(PIN) {
    rpio.poll(PIN, _gpioDetectClose, rpio.POLL_LOW);
}

// send message then clean the event
function _gpioDetectClose(PIN) {
    // send message to telegram
    sendMessage('磁鎖已鎖上');
    // clean the event after send message
    rpio.poll(PIN, null);
}

function gpioCleanup() {
    for(PIN of Object.values(ENV.PINS)) {
        rpio.close(PIN);
      }
      console.log('All gpio cleanup');
}

/* API method */

// send door state message to telegram
function sendMessage(message) {
    return new Promise((resolve, reject) => {
        request.post({
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
              if(error) {
                reject(ENV.devMode === true ? error : 'Telegram bot error');
              }
              resolve(messageBody);
          });
    });
}

// adjust camera
function adjustCamera(messageBody) {
    return new Promise((resolve, reject) => {
        request.get(ENV.adjustCameraURL, function (error, response, body) {
            if(error) {
                reject(ENV.devMode === true ? error : 'Adjust camera error');
            }
            resolve(messageBody);
        });
    });
}

// reply message with a photo
function replyMessage(messageBody) {
    return new Promise((resolve, reject) => {
        messageBody = JSON.parse(messageBody);
        request.post({
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
                reject(ENV.devMode === true ? error : 'Reply message error');
            }
            resolve('Reply message success');
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
