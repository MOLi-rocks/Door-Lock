const rpio = require('rpio');
const request = require('request');
const ENV = require('./env.json');

// avoid send really close message too many times, GPIO poll_HIGH may detect many times when change to HIGH
var reduceGPIO = true;
// control led blink
var doorClosed = false;

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
    // set red led pin and let it dark
    rpio.open(ENV.PINS.led_red, rpio.OUTPUT, rpio.LOW);
    // set green led pin and let it bright
    rpio.open(ENV.PINS.led_green, rpio.OUTPUT, rpio.HIGH);
    // set state's pin. When door close, the pin will get HIGH.
    rpio.open(ENV.PINS.state, rpio.INPUT, rpio.PULL_DOWN);
    // bind event to detect the door really close
    _gpioBindEvent(ENV.PINS.state);
}

// read gpio
function gpioRead(PIN) {
    return rpio.read(PIN);
}

// door wait for close's led blink
function blink_led() {
    setTimeout(function(){
        rpio.write(ENV.PINS.led_red, rpio.HIGH);
        rpio.msleep(500);
        rpio.write(ENV.PINS.led_red, rpio.LOW);
        rpio.msleep(250);
        if(doorClosed == true) {
            // if closed let it still bright
            rpio.write(ENV.PINS.led_red, rpio.HIGH);
        } else {
            blink_led();
        }
    }, 750);
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
        // let red led dark and let green led bright
        rpio.write(ENV.PINS.led_red, rpio.LOW);
        rpio.write(ENV.PINS.led_green, rpio.HIGH);
        // reset doorClosed
        doorClosed = false;
        resultObject.action = '開門';
    } else {
        // Set to false allow send message
        reduceGPIO = false;
        // let green led dark
        rpio.write(ENV.PINS.led_green, rpio.LOW);
        // let led blink before door really closed
        blink_led();
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
    rpio.poll(PIN, _gpioDetectClose, rpio.POLL_HIGH);
}

// send message then clean the event
function _gpioDetectClose(PIN) {
    // when not in reduce mode, it will send message for door closed
    if(reduceGPIO == false) {
        // let red led bright
        doorClosed = true;
        // send message to telegram
        sendMessage('磁鎖已鎖上');
        reduceGPIO = true;
    }
    // clean the event after send message
    // rpio.poll(PIN, null);
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
