const mongoose=require('mongoose');


const connectToDb=()=>{
    mongoose.connect(process.env.MONGO_ID).then(()=>{
        console.log("conneccted to db");
    })
}
module.exports=connectToDb
