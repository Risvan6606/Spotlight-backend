const { Timestamp } = require('bson')
const mongoose = require('mongoose')
const userSchema = mongoose.Schema({
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        default: '-1'
    },
    profile: {
        type: String,
        default: 'https://res.cloudinary.com/dqn0v17b6/image/upload/v1691727669/routcpczust6tlyknhyy.jpg'
    }
}, {
    timestamps: true
})
const userModel = mongoose.model('user', userSchema)
module.exports = userModel;