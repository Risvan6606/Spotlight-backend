const mongoose = require('mongoose')
const adminSchema = mongoose.Schema({
    name: {
        type: String,
        default: 'Rivan'
    },
    email: {
        type: String,
        requried: false
    },
    password: {
        type: String,
        requried: false
    }
}, {
    timestamps: true
})
const adminModel = mongoose.model('admin', adminSchema)
module.exports = adminModel