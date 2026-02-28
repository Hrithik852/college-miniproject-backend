const express=require('express')
const authRouter=require('./routes/auth.routes')
const ticketRouter=require('./routes/ticket.routes')
const app=express()
app.use(express.json())
app.use('/api/auth',authRouter);
app.use('/api/tickets',ticketRouter);

module.exports=app
