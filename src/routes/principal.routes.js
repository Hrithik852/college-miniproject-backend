const express = require('express');
const router = express.Router();
const principalController = require('../controllers/principal.controller');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');
const upload = require('../config/multer');

// All Principal routes require Principal role
router.use(authMiddleware);
router.use(roleMiddleware(['principal']));

// Dashboard Stats
router.get('/dashboard-stats', principalController.getDashboardStats);

// Role Management
router.get('/hods', principalController.getAllHODs);
router.get('/faculty', principalController.getAllFaculty);
router.patch('/manage-hod/:id/demote', principalController.demoteHOD);
router.patch('/assign-hod/:id', principalController.assignHOD);

// Records
router.get('/tickets', principalController.getAllInstitutionalTickets);
router.patch('/tickets/:id/resolve', principalController.resolveForwardedTicket);

// Profile
router.put('/profile', upload.memory.single('profileImage'), principalController.updatePrincipalProfile);

module.exports = router;
