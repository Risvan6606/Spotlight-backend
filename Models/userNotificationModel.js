const mongoose = require('mongoose')
const userNotificationSchema = mongoose.Schema({
    user_id: {
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
            default: true,
        },
        booking_id: {
            type: String,
            required: true
        },
        Actions: {
            type: String,
            default: 'Reject'
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    }]
}, {
    timestamps: true
})
const userNotificationModel = mongoose.model('userNotification', userNotificationSchema)
module.exports = userNotificationModel