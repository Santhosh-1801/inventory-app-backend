const express=require('express')
const router=express.Router();
const {registerUser,loginUser,logOut,getuserdata,loginStatus,updateUser,changePassword, forgotPassword, resetPassword}=require("../controllers/userController")
const protect=require("../middleware/authMiddleware");

router.post("/register",registerUser)
router.post("/login",loginUser)
router.get("/logout",logOut)
router.get("/getUserdata",protect,getuserdata)
router.get("/loggedin",loginStatus)
router.patch("/updateuser",protect,updateUser)
router.patch("/changepassword",protect,changePassword)
router.post("/forgotpassword",forgotPassword)
router.put("/resetpassword/:resetToken",resetPassword) 

module.exports=router