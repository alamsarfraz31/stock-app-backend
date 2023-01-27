const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const generateToken = (id) =>{
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: "1d"})
};

// Register User
const registerUser = asyncHandler( async (req, res) =>{
    const {name, email, password} = req.body

    // Validation
    if(!name || !email || !password){
        res.status(400)
        throw new Error("Plase fill in all required fields.")
    }
    if(password.length <6) {
        res.status(400)
        throw new Error("Password must be up to 6 Characters.")
    }

    // Check if user Email alerady Exist.
    const userExists = await User.findOne({email})
    if (userExists){
        res.status(400)
        throw new Error("Email Aleady has been registered")
    }

    // Encrypt Password before save it to DB
    //const salt = await bcrypt.genSalt(10)
    //const hashedPassword = await bcrypt.hash(password, salt)


    

    // Create new user
    const user = await User.create({
        name, 
        email, 
        password, //: hashedPassword,
    });

    //Generate Token
    const token = generateToken(user._id);
    
    //Send HTTP-only Cookie
    res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400),
        sameSite: "none",
        secure: true
    });

    if(user){
        const {_id, name, email, photo, phone, bio} = user
        res.status(201).json({
            _id, name, email, photo, phone, bio, token,
        });
    } else {
        res.status(400)
        throw new Error("Invalid User data.")
    }
});

// Login User
const loginUser = asyncHandler( async (req, res) => {
    //res.send("Login user")
    const {email, password} = req.body

    // Validate Request
    if(!email || !password) {
        res.status(400)
        throw new Error("Please Add Email and Password.")
    }

    // Check if User Exists
    const user = await User.findOne({email})

    if(!user) {
        res.status(400)
        throw new Error("User not Found Please Singup.");
    }

    // User Exists, Check if password is Correct
    const passwordIsCorrect = await bcrypt.compare(password, user.password)

        //Generate Token
        const token = generateToken(user._id);
    
        //Send HTTP-only Cookie
        res.cookie("token", token, {
            path: "/",
            httpOnly: true,
            expires: new Date(Date.now() + 1000 * 86400),
            sameSite: "none",
            secure: true
        });
         
    if(user && passwordIsCorrect) {
        const {_id, name, email, photo, phone, bio} = user
        res.status(200).json({
            _id, name, email, photo, phone, bio, token,
        });
    } else {
        res.status(400)
        throw new Error("Invalid Email or Password");
    }
    
});

// Logout User
const logout = asyncHandler (async (req, res)=>{
    //res.send("Logout User");
    res.cookie("token", "", {
        path: "/",
        httpOnly: true,
        expires: new Date(0),
        sameSite: "none",
        secure: true,
    });
    return res.status(200).json({ message: "Successfully Logged out"})
});

// Get User Data
const getUser = asyncHandler( async (req, res)=>{
    //res.send("Get User Data")
    const user = await User.findById(req.user._id)

    if(user){
        const {_id, name, email, photo, phone, bio} = user
        res.status(200).json({
            _id, name, email, photo, phone, bio,
        });
    } else {
        res.status(400)
        throw new Error("User Not Found.")
    }
});

// Get login Status
const loginStatus = asyncHandler( async (req, res)=>{
    const token = req.cookies.token
    if(!token){
        return res.json(false);
    }
    // Verify Token
    const verified = jwt.verify(token, process.env.JWT_SECRET)
    if(verified){
        return res.json(true);
    }
    return res.json(false);
    //res.send("Login Status")
});

const updateUser = asyncHandler (async (req, res)=>{
    //res.send("Update User")
    const user = await User.findById(req.user._id)
    if (user){
        const { name, email, photo, phone, bio} = user;
        user.email = email;
        user.name = req.body.name || name;
        user.phone = req.body.phone || phone;
        user.bio = req.body.bio || bio;
        user.photo = req.body.photo || photo;

        const updatedUser = await user.save()
        res.status(200).json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            photo: updatedUser.photo,
            phone: updatedUser.phone,
            bio: updatedUser.bio,
        })
    } else {
        res.status(404)
        throw new Error("User not Found")
    }
})

const chanagePassword = asyncHandler( async(req, res)=>{
    //res.send("Change Password")
    const user = await User.findById(req.user._id)

    const {oldPassword, password} = req.body
    if(!user) {
        res.status(400)
        throw new Error("User Not Found, Please Signup")
        }
    // Validate
    if(!oldPassword || !password) {
    res.status(400)
    throw new Error("Please Add old and New Password")
    }

    //check if Old password matches password in DB
    const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password)

    // Save new password
    if (user && passwordIsCorrect) {
        user.password = password
        await user.save()
        res.status(200).send("Password change successfully")
    } else {
        res.status(400)
    throw new Error("Old Password is incorrect")
    }

});

const forgotPassword = asyncHandler (async (req, res)=>{
    //res.send("Forgot Password")
    const {email} = req.body
    const user = await User.findOne({email})

    if (!user){
        res.status(404)
        throw new Error("User does not  exist")
    }

    // Delete token if it exist in DB
    let token = await Token.findOne({uerId: user._id})
    if (token) {
        await token.deleteOne()
    }

    // Create Reset Token
    let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
    console.log(resetToken)
    // Hash Token before saving to DB
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    
    // Save Token  to DB
    await new Token({
        userId: user._id,
        token: hashedToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * (60 * 1000)  // Thirty Minutes
    }).save()

    // Construct Reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`

    // Reset Email
    const message = `
    <h2>Hellow ${user.name}</h2>
    <p>Pleaseuser the url Bolow to rest Your Password</p>
    
    <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
    
    <p>Reagards...</p>
    <p>Stock Team</p>
    `;

    const subject = "Password Reset Request"
    const send_to = user.email
    const sent_from = process.env.EMAIL_USER

    try {
        await sendEmail(subject, message, send_to, sent_from)
        res.status(200).json({success: true, message: "reset Email sent"})
    } catch (error) {
        res.status(500)
        throw new  Error("Email Not sent, Please try Again")
    }

    //res.send("Forgot Password");
})

// Reset Password
const resetPassword = asyncHandler (async (req, res)=>{
    //res.send("Reset Password")
    
    const {password} = req.body
    const {resetToken} = req.params
    // Hash token,then compare to Token in DB
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    
    //Find Token in DB
    const userToken = await Token.findOne({
        token: hashedToken,
        expiresAt: {$gt: Date.now()}
    })

    if (!userToken) {
        res.status(404)
        throw new  Error("Invalid or Expir Token");
    }

    // Find user
    const user = await User.findOne({_id: userToken.userId})
    user.password = password
    await user.save()
    res.status(200).json({
        message: "Password Reset Successful, Please Login"
    })
})

module.exports = {
    registerUser,
    loginUser,
    logout,
    getUser,
    loginStatus,
    updateUser,
    chanagePassword,
    forgotPassword,
    resetPassword,

};