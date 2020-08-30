/*
1. create model
2. create route files
3. import the route in app.js, register the route app.use()
4. create controller
*/

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const app = express();

//control where the file should store
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        //1st param: error, 2nd param: file destination name
        cb(null, 'images'); 
    },
    filename: (req, file, cb) => {
        //1st param: error, 2nd param: file name
        // cb(null, new Date().toISOString() + '-'+file.originalname); //not applicable for windows
        cb(null, uuidv4());
    }
});

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
        //1st param: error, 2nd param: valid file extension
        cb(null, true); 
    } else {
        cb(null, false);
    }
};

app.use(bodyParser.json()); //parse incoming json data
/*
register multer. single() extract a single file stored in image folder in the incoming request
every incoming request is parsed for that file.
*/
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image')); 
app.use('/images', express.static(path.join(__dirname, 'images')));//serve image folder statically

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE'); 
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); 
    next();
});

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

/*
This will be executed whenever an error is thrown or forwarded with next
*/
app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({message: message, data:data});
});

mongoose.connect('mongodb+srv://sunyanl:Abcd9876@cluster0.tdztn.mongodb.net/data?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(result => {
        app.listen(8080);
    } )
    .catch(err => console.log(err));
