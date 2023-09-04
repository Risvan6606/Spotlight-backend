const mongoose = require('mongoose')
const artistSchema = mongoose.Schema({
    firstName: {
        type: String,
        requried: true
    },
    lastName: {
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
    }
}, {
    timestamps: true
})
const artistModel = mongoose.model('artist', artistSchema)
module.exports = artistModel