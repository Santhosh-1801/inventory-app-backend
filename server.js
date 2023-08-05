const dotenv=require('dotenv').config()
const express=require('express')
const mongoose=require('mongoose')
const bodyParser=require('body-parser')
const userRoute=require('./routes/userRoute')
const productRoute=require("./routes/productRoute")
const contactRoute=require("./routes/contactRoute")
const errorHandler=require("./middleware/errorMiddleware")
const cookieParser=require("cookie-parser")
const path=require("path")


const app=express()

const cors = require('cors');
app.use(
  cors({
    origin: ["http://localhost:3000", "https://pinvent-app.vercel.app"],
    credentials: true,
  })
);

app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extended:false}))
app.use(bodyParser.json())


app.use("/uploads",express.static(path.join(__dirname+"uploads")))

app.use("/api/users",userRoute)
app.use("/api/products",productRoute)
app.use("/api/contactus",contactRoute)

app.get("/",(req,res)=>{
     res.send("Hello home pages")
})
app.use(errorHandler)

const PORT=process.env.PORT || 5000

mongoose.set("strictQuery", false);

mongoose.connect(process.env.MONGO_URI).then(()=>{
  
    app.listen(PORT,()=>{
        console.log(`Server is running on PORT ${PORT}`)
    })

    })
    .catch((err)=>console.log(err))
