const mongoose = require('mongoose')
const bookingModel = require('./bookingSchema')
const ratingSchema = new mongoose.Schema({
    artist_id: {
        type: String,
        required: true
    },
    average: {
        type: Number,
        required: false
    },
    reviews: [{
        userName: {
            type: String,
            required: true
        },
        userEmail: {
            type: String,
            required: true
        },
        starRating: {
            type: Number,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        review: {
            type: String,
            required: true
        },
        userImage: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    }]
})
const ratingModel = mongoose.model('review', ratingSchema)
module.exports = ratingModel
