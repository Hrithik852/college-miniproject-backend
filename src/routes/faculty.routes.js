const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/faculty.controller');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');

router.use(authMiddleware);
router.use(roleMiddleware(['faculty', 'hod']));

router.get('/students', facultyController.getMyStudents);
router.get('/feedbacks', facultyController.getMyFeedbacks);
router.get('/feedbacks/:id/results', facultyController.getFeedbackResults);
router.post('/feedbacks', facultyController.createFeedbackForm);

module.exports = router;
