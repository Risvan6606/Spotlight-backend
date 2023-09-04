const mongoose = require('mongoose')
const notificationSchema = mongoose.Schema({
    artist_id: {
        type: String,
        ref: 'user',
        required: true
    },
    notifications: [{
        name: {
            type: String,
            required: true
        },
        status: {
            type: Boolean,
            default: true
        },
        booking_id: {
            type: String,
            required: true
        },
        Actions: {
            type: String,
            default: 'show'
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    }]
}, {
    timestamps: true
})
const notificationModel = mongoose.model('notification', notificationSchema)
module.exports = notificationModel
