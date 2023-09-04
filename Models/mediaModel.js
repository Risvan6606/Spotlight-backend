const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    artistId: {
        type: String,
        required: true
    },
    videos: [{
        video: {
            type: String,
            required: true
        },
        name: {
            type: String
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
}, {
    timestamps: true
});

const mediaModel = mongoose.model('Media', mediaSchema);
module.exports = mediaModel;
