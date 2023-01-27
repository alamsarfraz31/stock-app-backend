const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please add a Name."]
    },
    email: {
        type: String,
        required: [true, "Please add an Email."],
        unique: true,
        trim: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please Enter a Valid Email."
        ]
    },
    password: {
        type: String,
        required: [true, "Please Enter Password."],
        minLenght: [6, "Password must be upto 6 Character."],
    //    maxLenght: [23, "Password must not be more than 23 Character."]
    },
    photo: {
    type: String,
    required: [true, "Please add a Photo."],
    default: "https://res.cloudinary.com/djjmju6m6/image/upload/v1674547052/Stock/360_F_65104718_x17a76wzWKIm3BlhA6uyYVkDs9982c6q_wt1o7u.jpg"
    },
    phone: {
        type: String,
        default: "+91"
        },
    bio: {
        type: String,
        minLenght: [250, "Bio must bot be more than 250 characters."],
        default: "bio"
        }    
    
}, {
    timestamps: true,
});

// Encrypt password bofore saving to DB
userSchema.pre("save", async function(next) {
    if(!this.isModified("password")){
        return next()
    }

    // Hass password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(this.password, salt)
    this.password = hashedPassword
    next()
})

const User = mongoose.model("User", userSchema);
module.exports = User