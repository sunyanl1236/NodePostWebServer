const fs = require('fs'); //file system
const path = require('path'); //file system
const {validationResult} = require('express-validator');

const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = (req, res, next) => {
    //client: fetch('http://localhost:8080/feed/posts?page='+page). so page info stored in 'query' property
    const currentPage = req.query.page || 1;
    const perPage = 2;
    let totalItems;
    //countDocuments() counts but not retrieve
    Post.find().countDocuments().then(count => {
        totalItems = count;
        //skip(): if in page 1, skip no items, if in page 2, skip 2 items
        //limit() limites the item number
        return Post.find().skip((currentPage-1)*perPage).limit(perPage);
    }).then(posts => {
        res.status(200).json({message: 'Fetched posts successfully.', posts:posts, totalItems:totalItems});
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    });
   
}

exports.createPost = (req, res, next) => {
    const errors = validationResult(req); //extract errors that the validationResult gather
    if(!errors.isEmpty()){//if has error
        //422: validation failed
        // return res.status(422).json({message: 'Validation failed, entered data is incorrect.', errors: errors.array()});

        //error handling
        const error = new Error('Validation failed, entered data is incorrect.');
        error.statusCode = 422;
        throw error; //sync code, the thrown error will try to reach to the error handling middleware provided in the express
    }
    if(!req.file){
        const err = new Error('No image provided');
        err.statusCode = 422;
        throw err;
    }
    const imageUrl = req.file.path.replace('\\', '/');
    const title = req.body.title;
    const content = req.body.content;
    let creator;
    const post = new Post({ //mondoose will generate _id and created data for us
        title: title, 
        content: content, 
        imageUrl: imageUrl,
        creator: req.userId //from the req in the is-auth.js
    });
    post.save()  //save new post to the database
    .then(result => {
        //connect the post to user
        return User.findById(req.userId);
    })
    .then(user => {
        creator = user;
        user.posts.push(post); //User has posts array
        return user.save();
    })
    .then(result => {
        //echo back the post
        //may have a 200 status before 201, it's OPTION
        res.status(201).json({
            message: 'Post created successfully',
            post: post,
            //pass extra information about creator in response through variable
            creator: {_id: creator._id, name: creator.name} 
        });
    })
    .catch( err => {
        if(!err.statusCode){
            err.statusCode = 500; //client side error
        }
        //cannot use throw err since it is async code
        //use next(), so the err can be passed to the next express middleware(in the app.js)
        next(err); 
    });
};

exports.getPost = (req, res, next) => {
    const postId = req.params.postId; //the postId should be the same as '/post/:postId'
    Post.findById(postId).then(post => {
        if(!post){
            const error = new Error('Could not find post!');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({message: 'Post fetched.', post:post});
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    });
}

//2. add controller for the route
exports.updatePost = (req, res, next) => {
    const postId = req.params.postId;
    const errors = validationResult(req); 
    if(!errors.isEmpty()){//if has error
        const error = new Error('Validation failed, entered data is incorrect.');
        error.statusCode = 422;
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image; //if the imageUrl is not changed, no new file is provided
    console.log(req, imageUrl, req.file);
    if(req.file){
        imageUrl = req.file.path.replace("\\", "/");
    }
    if(!imageUrl){
        const error = new Error('No file picked.');
        error.statusCode = 422;
        throw error;
    }
    Post.findById(postId).then(post => {
        if(!post){
            const error = new Error('Could not find post!');
            error.statusCode = 404;
            throw error;
        }
        //check the user id is the currently login user
        if(post.creator.toString() !== req.userId){
            const error = new Error('Not authorized!');
            error.statusCode=403; //403: authentication issue
            throw error;
        }
        if(post.imageUrl !== imageUrl){
            clearImage(imageUrl);
        }
        post.title = title;
        post.imageUrl = imageUrl;
        post.content = content;
        return post.save(); //override the old post but keep the post id
    }).then(result => {
        res.status(200).json({message: 'Post updated!', post: result});
    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    });
}

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
    .then(post => {
        if(!post){
            const error = new Error('Could not find post!');
            error.statusCode = 404;
            throw error;
        }
        //check the user id is the currently login user
        if(post.creator.toString() !== req.userId){
            const error = new Error('Not authorized!');
            error.statusCode=403; //403: authentication issue
            throw error;
        }
        clearImage(post.imageUrl);
        return Post.findByIdAndRemove(postId);
    })
    .then(result => { //find the user who created the post
        return User.findById(req.userId);
    })
    .then(user => {//remove the post from the posts array in User
        user.posts.pull(postId);
        return user.save();
    })
    .then(result => {
        console.log(result);
        res.status(200).json({message: 'Deleted post.'});
    })
    .catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    });
}

//trigger this function when uploaded the new image
const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
}