const express = require('express');
const router = express.Router();
const hodController = require('../controllers/hod.controller');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');
const upload = require('../config/multer');

// All HOD routes require HOD role
router.use(authMiddleware);
router.use(roleMiddleware(['hod']));

// Dashboard & Lists
router.get('/students', hodController.getDepartmentStudents);
router.get('/faculty', hodController.getDepartmentFaculty);

// Grievance/Ticket Management
router.get('/tickets', hodController.getDepartmentTickets);
router.patch('/tickets/:id/status', hodController.updateTicketStatus);
router.post('/tickets/:id/forward', hodController.forwardTicketToPrincipal);

// Feedback Monitoring
router.get('/faculty-feedback', hodController.getDepartmentFeedbackForms);
router.get('/feedback-results/:formId', hodController.getFeedbackResults);
router.get('/feedbacks-dashboard', hodController.getDepartmentFeedbackDashboard);
router.delete('/feedbacks/:id', hodController.deleteFeedbackForm);

// Profile
router.put('/profile', upload.memory.single('profileImage'), hodController.updateHODProfile);

module.exports = router;
