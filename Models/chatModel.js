const mongoose = require('mongoose')
const chatSchema = new mongoose.Schema({
    room_id: {
        type: String,
        required: true
    },
    history: [
        {
            userName: {
                type: String
            },
            sender_id: {
                type: String,
                required: true
            },
            chat: {
                type: String
            },
            time: {
                type: Date
            }
        }
    ]
},
    {
        timestamps: true,
    }
);

const chatModel = mongoose.model('chatHistory', chatSchema)
module.exports = chatModel
