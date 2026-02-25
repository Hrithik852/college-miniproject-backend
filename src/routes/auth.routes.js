const express=require('express')
const authContollers=require('../controllers/auth.controllers')
const authRouter=express.Router()

authRouter.post('/register',authContollers.registerController)

module.exports=authRouter