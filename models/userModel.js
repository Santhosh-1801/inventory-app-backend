const mongoose=require('mongoose');
const bcrypt=require('bcryptjs')

const userSchema=mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please add a name"],
    },
    email:{
        type:String,
        required:[true,"Please add a email"],
        unique:true,
        trim:true,
        match:[/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,"Please enter valid email address"],
    },
    password:{
        type:String,
        required:[true,"Please enter the password"],
        minLength:[6,"Password must be 6 characters"],
    },
    photo:{
        type:String,
        required:[true,"Please add a photo"],
        default:"https://i.ibb.co/4pDNDk1/avatar.png",

    },
    phone:{
        type:String,
        default:"+91",
    },
    bio:{
        type:String,
        maxLength:[32,"Password must not be more than 32 characters"],
        default:"bio",
    }

},{
    timestamps:true,
})

userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
        return next();
    }
    const salt=await bcrypt.genSalt(10)
    const hashedPassword=await bcrypt.hash(this.password,salt)
    this.password=hashedPassword
})


const User=mongoose.model("User",userSchema)
module.exports=User
