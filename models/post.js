const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    creator: { //relation of post and users
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
    /*
    2nd param is optional configuaration. 
    {timestamps: true} means whenever a new post object is added into the db, mongoose will add the create time and update time automatically
    */
}, {timestamps: true}); 

module.exports = mongoose.model('Post', postSchema);