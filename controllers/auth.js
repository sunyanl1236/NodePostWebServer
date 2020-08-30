const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signup = (req, res, next) => {
    const errors = validationResult(req);
    if(!error.isEmpty()){
        const error = new Error();
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    //need to hash password
    bcrypt.hash(password, 12).then(hashedPw => {
        const user = new User({
            email: email,
            name: name,
            password: hashedPw
        });
        return user.save();
    }).then(result => {
        //201: success and create new data
        res.status(201).json({message: 'User created!', userId: result._id});
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    });
}

exports.login =  (req, res, next) => {
    const email = req.body.email;
    const password = rea.body.password;
    let loadedUser;
    User.findOne({email: email}).then(user => {
        if(!user){
            const error = new Error('A user with this email could not be found.');
            error.statusCode = 401; //401 Unauthorized
            throw error;
        }
        loadedUser=user;
        return bcrypt.compare(password, user.password); //return a promise
    }).then(isEqual => {
        if(!isEqual){
            const error = new Error('Wrong password.');
            error.statusCode = 401;
            throw error;
        }
        /*
        generate JWT(json web token)
        sign() create a new signature and packs that into a new json web token
        1st param: can pass any information you want to store in the token
        2nd param: private key which is only known to the server so we cannot fake it in the client
        3rd param: expire time

        because the token is stored in the client, that token could be stolen. 
        If the user does not logout, another person copies the token from his browser storage and then he can use it on his own PC.
        */
        const token = jwt.sign({email: loadedUser.email, userId: loadedUser._id.toString()}, 'somesupersupersecret', {expiresIn: '1h'}); 
        res.status(200).json({token: token, userId: loadedUser._id.toString()});
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    });
}

exports.getUserStatus = (req, res, next) => {
    //each requst with token sent should has req.userId
    User.findById(req.userId).then(user => {
        if(!user){
            const error = new Error('User is not found.');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({status: user.status});
        // const userStatus = user.status;
        // user.status = '';
        // return user.save();
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    });
}

exports.updateUserStatus = (req, res, next) => {
    const newStatus = req.body.status; //the client is responsible for set the 'body' in requst
    User.findById(req.userId).then(user => {
        if(!user){
            const error = new Error('User is not found.');
            error.statusCode = 404;
            throw error;
        }
        user.status = newStatus;
        return user.save();
    }).then(result => {
        res.status(200).json({message: 'User updated.'});
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    });
}