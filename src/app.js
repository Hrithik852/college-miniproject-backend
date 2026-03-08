const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const authRouter = require('./routes/auth.routes');
const ticketRouter = require('./routes/ticket.routes');
const studentRouter = require('./routes/student.routes');
const hodRouter = require('./routes/hod.routes');
const principalRouter = require('./routes/principal.routes');
const notificationRouter = require('./routes/notification.routes');
const facultyRouter = require('./routes/faculty.routes');
const app = express();

app.use(cors({
    origin: 'http://localhost:5173', // or your frontend URL
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRouter);
app.use('/api/tickets', ticketRouter);
app.use('/api/student', studentRouter);
app.use('/api/hod', hodRouter);
app.use('/api/principal', principalRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/faculty', facultyRouter);

module.exports = app;
