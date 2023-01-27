const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const sendEmail = require("../utils/sendEmail");

const contactUs = asyncHandler ( async (req, res)=>{
    //res.send("Contact Us")
    const { subject, message} = req.body
    const user = await User.findById(req.user._id);

    if(!user){
        res.status(400)
        throw new Error("User Not Found, Please SignUp")
    }

    // Validation
    if (!subject || !message) {
        res.status(400)
        throw new Error("Please Add Subject and Message")
    }

    const send_to = process.env.EMAIL_USER
    const sent_from = process.env.EMAIL_USER
    const reply_to = user.email

    try {
        await sendEmail(subject, message, send_to, sent_from, reply_to)
        res.status(200).json({success: true, message: "Email sent"})
    } catch (error) {
        res.status(500)
        throw new  Error("Email Not sent, Please try Again")
    }
});

module.exports = {
    contactUs,
}