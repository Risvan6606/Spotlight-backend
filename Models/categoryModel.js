const mongoose = require('mongoose')
const categorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    }
})
const categoryModel = mongoose.model('category', categorySchema)
module.exports = categoryModel