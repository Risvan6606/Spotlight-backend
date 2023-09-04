const mongoose = require('mongoose')
const bannerSchema = mongoose.Schema({
    title: {
        type: String,
        require: true
    },
    discription: {
        type: String,
        require: true
    },
    image: {
        type: String,
        require: true
    },
    status: {
        type: Boolean,
        default: true
    }
})
const bannerModel = mongoose.model('banner', bannerSchema)
module.exports = bannerModel;