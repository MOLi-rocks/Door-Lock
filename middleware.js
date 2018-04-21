// Token verify middleware
function verifyToken(request, response, next) {
    let token = request.body.token
    for (TYPE of ENV.TOKENS) {
        if (token === TYPE.token) {
            request.tokenTitle = TYPE.title;
            next();
        }
    }
    let resMsg = 'Verify error';
    return response.status(400).send(JSON.stringify(resMsg));
}

module.exports = {
    verifyToken
};