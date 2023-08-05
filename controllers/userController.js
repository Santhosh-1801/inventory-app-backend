const asynchandler=require('express-async-handler')
const User=require('../models/userModel');
const jwt=require('jsonwebtoken')
const bcrypt=require('bcryptjs')
const Token=require('../models/tokenModel')
const crypto=require("crypto");
const { reset } = require('nodemon');
const sendEmail = require('../utils/sendMail');

const generateToken=(id)=>{
  return jwt.sign({id},process.env.JWT_SECRET,{expiresIn:"1d"})
}


const registerUser=asynchandler(async(req,res)=>{
    const {name,email,password}=req.body;

    if(!name || !email || !password){
        res.status(400)
        throw new Error("Please fill in all required fields")
    }
    if(password.length<6){
        res.status(400)
        throw new Error("Please enter the password more than 6 characters")
    }
    const userExits=await User.findOne({email})

    if(userExits){
        res.status(400)
        throw new Error("Email has been already registered")
    }

  




    const user=await User.create({
        name,
        email,
        password,
    })
    const token=generateToken(user._id)

    res.cookie("token",token,{
        path:"/",
        httpOnly:true,
        expires:new Date(Date.now()+1000*86400),
        sameSite:"none",
        secure:true,
    })

    if(user){
        const {_id,name,email,photo,phone,bio}=user
        res.status(201).json({
            _id,name,email,photo,phone,bio,token,
        })
    }
    else {
        res.status(400)
        throw new Error("Invalid User data")
    }

       
})

const loginUser=asynchandler(async(req,res)=>{
    const {email,password}=req.body;
    if(!email || !password){
        res.status(400);
        throw new Error("Please add email and password");

    }
    const user=await User.findOne({email})
    if(!user){
        res.status(400);
        throw new Error("User not found, please register to access")
    }

    const passwordisCorrect=await bcrypt.compare(password,user.password)

    const token=generateToken(user._id)

    res.cookie("token",token,{
        path:"/",
        httpOnly:true,
        expires:new Date(Date.now()+1000*86400),
        sameSite:"none",
        secure:true,
    })

    if(user && passwordisCorrect){
         const {_id,name,email,photo,phone,bio}=user
         res.status(200).json({
            _id,name,email,photo,phone,bio,token,
        })
        
    }
    else {
        res.status(400);
        throw new Error("Invalid username or password")
    }

})
const logOut=asynchandler(async(req,res)=>{
 res.cookie("token","",{
        path:"/",
        httpOnly:true,
        expires:new Date(0),
        sameSite:"none",
        secure:true,
    })
    return res.status(200).json({message:"Successfully Logged Out"})
})

const getuserdata=asynchandler(async(req,res)=>{
    const user=await User.findById(req.user._id)

    if(user){
        const {_id,name,email,photo,phone,bio}=user
        res.status(200).json({
            _id,name,email,photo,phone,bio,
        })
    }
    else {
        res.status(400)
        throw new Error("Invalid User data")
    }
})
const loginStatus=asynchandler(async(req,res)=>{
    const token=req.cookies.token
    if(!token){
        return res.json(false)
    }
    const verified=jwt.verify(token,process.env.JWT_SECRET)
    if(verified){
        return res.json(true)
    }
    return res.json(false)
})
const updateUser=asynchandler(async(req,res)=>{
    const user=await User.findById(req.user._id)
    if(user){
        const {name,email,photo,phone,bio}=user;
        user.email=email
        user.name=req.body.name || name 
        user.phone=req.body.phone || phone 
        user.bio=req.body.bio || bio 
        user.photo=req.body.photo || photo 

        const updatedUser=await user.save();
        res.status(200).json({
            _id:updatedUser._id,
            name:updatedUser.name,
            email:updatedUser.email,
            photo:updatedUser.photo,
            phone:updatedUser.phone,
            bio:updatedUser.bio,
        })

    }else{
        res.status(404)
        throw new Error("User not found")
    }
})
const changePassword=asynchandler(async(req,res)=>{
    const user=await User.findById(req.user._id)

    const {oldPassword,password}=req.body

    if(!user){
        res.status(400);
        throw new Error("User not found")

    }
    if(!oldPassword || !password){
        res.status(400);
        throw new Error("Please add old and new password")

    }
    const passwordisCorrect=await bcrypt.compare(oldPassword,user.password)
    if(user && passwordisCorrect){
        user.password=password
        await user.save()
        res.status(200).send("Password change successful")
    }
    else {
        res.status(400)
        throw new Error("Old password is incorrect")
    }
    
})
const forgotPassword=asynchandler(async(req,res)=>{
    const {email}=req.body 
    const user=await User.findOne({email})
    if(!user){
        res.status(404)
        throw new Error("User does not exist")
    }
    let token=await Token.findOne({userId:user._id})
    if(token){
        await token.deleteOne()
    }
    let resetToken=crypto.randomBytes(32).toString("hex")+user._id
    console.log(resetToken)
    const hashedToken=crypto.createHash("sha256").update(resetToken).digest("hex")
    await new Token({
        userId:user._id,
        token:hashedToken,
        createdAt:Date.now(),
        expiresAt:Date.now()+30 * (60*1000),
    }).save()
    const reseturl=`${process.env.FRONTEND_URL}/resetpassword/${resetToken}`
    const message=`<h2>Hello ${user.name}</h2><p>Please use the url below to reset your password</p><p>This reset link is valid only for 
    30 minutes</p><a href=${reseturl} clicktracking=off>${reseturl}</a>`
    const subject="Password Reset Request"
    const send_to=user.email
    const send_from=process.env.EMAIL_USER 
    
    try{
        await sendEmail(subject,message,send_to,send_from)
        res.status(200).json({success:true,message:"Resent Email Sent"})
    }
    catch(error){
        res.status(500)
        throw new Error("Email not sent,please try again later")

    }

})
const resetPassword=asynchandler(async(req,res)=>{
    const {password}=req.body 
    const {resetToken}=req.params 

    const hashedToken=crypto.createHash("sha256").update(resetToken).digest("hex");
    const userToken=await Token.findOne({token:hashedToken,expiresAt:{$gt:Date.now()}})
    if(!userToken){
        res.status(404)
        throw new Error("Invalid or Token has been expired")

    }
    const user=await User.findOne({_id:userToken.userId})
    user.password=password
    await user.save()
    res.status(200).json({
        message:"Password Reset Successful,Please Login"
    })

})


module.exports={
    registerUser,
    loginUser,
    logOut,
    getuserdata,
    loginStatus,
    updateUser,
    changePassword,
    forgotPassword,
    resetPassword,
}