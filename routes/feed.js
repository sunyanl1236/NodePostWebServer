const express = require('express');
//add validator to the routes
const {body} = require('express-validator'); //body: check the request body

const feedController = require('../controllers/feed');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// GET /feed/posts
//'/feed/posts' should response to the getPosts() in controller
//add isAuth to validate the token and add headers to fetch() in client side
router.get('/posts', isAuth, feedController.getPosts); 

// POST /feed/post
//add the middleware to check the body validation, and the validation result can be handled in the controller
router.post('/post', isAuth,[
    body('title').trim().isLength({min: 5}),
    body('content').trim().isLength({min: 5})
], feedController.createPost);

router.get('/post/:postId', isAuth, feedController.getPost);

//1, write route. replace post uses PUT method (overwrite) which need body like POST and post id
router.put('/post/:postId', isAuth, [
    body('title').trim().isLength({min: 5}),
    body('content').trim().isLength({min: 5})
], feedController.updatePost);

//DELETE not receive a body
router.delete('/post/:postId', isAuth, feedController.deletePost);

module.exports = router;