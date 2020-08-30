//validate incoming token
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) =>{
    const authHeader = req.get('Authorization');
    if(!authHeader){
        const error = new Error('Not authenticated');
        error.statusCode = 401;
        throw error;
    }
    const token = authHeader.split(' ')[1]; //get the token from the 'Authorization' header in client side
    let decodedToken;
    try{
        /*
        decodedToken() only decode token, not verify it
        verify() decode and verify token
        1st param: token extracted from the headers
        2nd param: the secret key same as controller
        */
        decodedToken = jwt.verify(token, 'somesupersupersecret');
    } catch(err){
        err.statusCode(500);
        throw err;
    }
    if(!decodedToken){
        const error = new Error('Not authenticated');
        error.statusCode = 401;
        throw error;
    }
    //store the token in the request so that I can use it in other places where this request will go, like in my routes
    req.userId = decodedToken.userId;
    next();
}