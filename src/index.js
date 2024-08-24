import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: './.env'
});

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 ,()=>{
        app
        console.log(`server started on port ::  ${process.env.PORT}`)
    });
})
.catch((e)=>{
    console.log("MongoDb connection failed in index.js " , e);
})



// import express from "express";
// import mongoose from "mongoose";
// import { DB_NAME } from "./constants.js";


// const app = express();

// app.get('/', (req, res) => {
//     res.send('Hello, World!');
// });

// (async ()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on('error', (error)=>{
//             console.log('ERRROR: ' + error)
//             throw error;
//         })

//         app.listen(process.env.PORT, ()=>{
//             console.log(`listening on port  + ${process.env.PORT}`);
//         });
        
//     } catch (error) {
//         console.error("ERROR: " + error);
//         throw error;    
//     }
// })()