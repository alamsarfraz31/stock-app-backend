const mongoose = require("mongoose");

const  tokenSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "user"
    },
    token: {
        type: String,
        rquired: true,
    },
    createdAt: {
        type: Date,
        rquired: true,
    },
    expiresAt: {
        type: Date,
        rquired: true,
    }

});

const Token = mongoose.model("Token", tokenSchema);
module.exports = Token