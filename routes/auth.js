const express = require('express');
/*
validation step:
1. import body in express-validator in routes
2. add validation in 2nd argument in router
3. add valiadtionResult in express-validator in controller
4. collect error in functions in controller: const errors = validationResult(req);
*/
const {body} = require('express-validator'); 

const User = require('../models/user');
const authController = require('../controllers/auth');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

//override the user info, don't use POST
router.put('/signup', [
    body('email').isEmail().withMessage('Please enter a valid email')
    //return true if validate succeed, or return a promise if validation uses async test
    .custom((value, {req}) => {
        return User.findOne({email: value}).then(userDoc => {
            if(userDoc){
                return Promise.reject('Email address already exists!');
            }
        });
    }).normalizeEmail(),
    body('password').trim().isLength({min: 5}),
    body('name').trim().not().isEmpty()
], authController.signup);

router.post('/login', authController.login);

//this route is only exposed to authenticated user
router.get('/status', isAuth, authController.getUserStatus);

router.patch('/status', isAuth, [
    body('status').trim().not().isEmpty()
],  authController.updateUserStatus);

module.exports = router;