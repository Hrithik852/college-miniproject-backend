const express = require('express');
const router = express.Router();
const { 
    getProfile,
    updateProfile, 
    getFeedbacks, 
    submitFeedback, 
    raiseTicket,
    getMyTickets
} = require('../controllers/student.controller');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');
const upload = require('../config/multer');

// All routes here require student role
router.use(authMiddleware);
router.use(roleMiddleware(['student']));

// Profile
router.get('/profile', getProfile);
router.put('/profile', upload.memory.single('profileImage'), updateProfile);

// Feedbacks
router.get('/feedbacks', getFeedbacks);
router.post('/feedbacks/:id/submit', submitFeedback);

// Tickets
router.post('/tickets', upload.memory.single('attachment'), raiseTicket);
router.get('/tickets', getMyTickets);

module.exports = router;
