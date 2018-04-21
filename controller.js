/* GPIO functions */

function gpioInit(rpio, ENV_PINS) {
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

function gpioRead(rpio ,PIN) {
    return rpio.read(PIN);
}

function gpioSwitch(rpio, PIN, tokenTitle, message) {
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

module.exports = {
    gpioInit,
    gpioRead,
    gpioSwitch
};
