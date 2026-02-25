const mongoose=require('mongoose')
const StudentSchema=new  mongoose.Schema({
    username:{
        type:String,
        required:[true,'username required'],
        email:{
            type:String,
            required:[true,'email is required'],
            unique:[true,'email already in use'],
            match:[/^adr(2[2-5])(cs|ec|ee|ds|me)(\d{2,3})@cea\.ac\.in$/, 
      'Please provide a valid institutional email (e.g., adr22cs01@cea.ac.in)']
        }
    }
})

const studentModel=mongoose.model("students",StudentSchema);
module.exports=studentModel;