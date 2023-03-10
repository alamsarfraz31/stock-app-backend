const dotenv = require("dotenv").config();
const express = require ("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const userRoute = require("./routes/userRoute")
const productRoute = require("./routes/productRoute")
const contactRoute = require("./routes/contactRoute")
const errorHandler = require("./middleWare/errorMiddleware");
const cookieParser = require("cookie-parser");
const path = require("path");


const app = express();

// Midlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cors({
    origin: ["http://localhost:3000", "https://stock-app-rs2i.onrender.com"],
    credentials: true,
}));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//Route Middleware
app.use("/api/users", userRoute)
app.use("/api/products", productRoute)
app.use("/api/contactus", contactRoute)

// Routes
app.get("/", (req, res) =>{
    res.send("Home Page............");
})

// Error Middleware
app.use(errorHandler);

//Connect to DB and Start Server
const PORT = process.env.PORT || 5000


mongoose
        .connect(process.env.MONGO_URI)
        .then(()=>{
            app.listen(PORT, ()=>{
                console.log(`Server Running on ${PORT}`);
                
            })
        })
        .catch((err) => console.log(err))
