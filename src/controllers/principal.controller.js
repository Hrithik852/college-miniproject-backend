const { User, Student, Faculty, HOD, Principal } = require('../models/user.model');
const Ticket = require('../models/ticket.model');
const { Feedback } = require('../models/feedback.model');
const Notification = require('../models/notification.model');
const imagekit = require('../config/imagekit');
const path = require('path');

// @desc    Get all HODs
// @route   GET /api/principal/hods
// @access  Private (Principal)
exports.getAllHODs = async (req, res) => {
    try {
        const hods = await HOD.find({ role: 'hod' }).select('-password');
        res.status(200).json({
            success: true,
            count: hods.length,
            data: hods
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all Faculty
// @route   GET /api/principal/faculty
// @access  Private (Principal)
exports.getAllFaculty = async (req, res) => {
    try {
        const faculty = await Faculty.find({ role: 'faculty' }).select('-password');
        res.status(200).json({
            success: true,
            count: faculty.length,
            data: faculty
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Demote HOD to Faculty
// @route   PATCH /api/principal/manage-hod/:id/demote
// @access  Private (Principal)
exports.demoteHOD = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role !== 'hod') {
            return res.status(400).json({ success: false, message: 'Target user is not an HOD' });
        }

        user.role = 'faculty';
        // HODs and Faculty share the same discriminator base (User with no extra required fields in this project)
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Role updated successfully: HOD demoted to Faculty',
            data: user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Assign HOD role to a Faculty member
// @route   PATCH /api/principal/assign-hod/:id
// @access  Private (Principal)
exports.assignHOD = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role !== 'faculty') {
            return res.status(400).json({ success: false, message: 'Only faculty members can be promoted to HOD' });
        }

        // Auto-demote any existing HOD in the same department
        const existingHOD = await User.findOne({ role: 'hod', department: user.department });
        if (existingHOD) {
            existingHOD.role = 'faculty';
            await existingHOD.save();
        }

        user.role = 'hod';
        await user.save();

        res.status(200).json({
            success: true,
            message: existingHOD
                ? `${existingHOD.username} demoted to Faculty. ${user.username} promoted to HOD.`
                : `${user.username} promoted to HOD successfully.`,
            data: user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Institutional Dashboard Stats
// @route   GET /api/principal/dashboard-stats
// @access  Private (Principal)
exports.getDashboardStats = async (req, res) => {
    try {
        const [studentCount, facultyCount, hodCount, ticketCount, resolvedTickets] = await Promise.all([
            Student.countDocuments({ role: 'student' }),
            Faculty.countDocuments({ role: 'faculty' }),
            HOD.countDocuments({ role: 'hod' }),
            Ticket.countDocuments({}),
            Ticket.countDocuments({ status: 'Resolved' })
        ]);

        res.status(200).json({
            success: true,
            data: {
                studentCount,
                facultyCount,
                hodCount,
                ticketCount,
                resolutionRate: ticketCount > 0 ? Math.round((resolvedTickets / ticketCount) * 100) : 0,
                resolvedTickets
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get All Institutional Records (Tickets)
// @route   GET /api/principal/tickets
// @access  Private (Principal)
exports.getAllInstitutionalTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ forwardedToPrincipal: true })
            .populate('student', 'firstName lastName email collegeId department')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: tickets.length,
            data: tickets
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Resolve a ticket forwarded to Principal
// @route   PATCH /api/principal/tickets/:id/resolve
// @access  Private (Principal)
exports.resolveForwardedTicket = async (req, res) => {
    try {
        const { status, actionTaken, remarks } = req.body;

        const ticket = await Ticket.findOne({
            _id: req.params.id,
            forwardedToPrincipal: true
        });

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        ticket.status = status || ticket.status;
        if (actionTaken || remarks) {
            ticket.resolution = {
                actionTaken: actionTaken || ticket.resolution?.actionTaken,
                remarks: remarks || ticket.resolution?.remarks,
                resolvedBy: req.user._id,
                resolvedAt: Date.now()
            };
        }

        await ticket.save();

        // Notify the student
        await Notification.create({
            recipient: ticket.student,
            type: 'ticket_resolved',
            message: `Your grievance ticket "${ticket.subject}" has been resolved by the Principal${actionTaken ? `: ${actionTaken}` : ''}`,
            relatedTicket: ticket._id
        });

        res.status(200).json({ success: true, data: ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update Principal profile
// @route   PUT /api/principal/profile
// @access  Private (Principal)
exports.updatePrincipalProfile = async (req, res) => {
    try {
        const updates = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            phone: req.body.phone,
            gender: req.body.gender,
            institution: req.body.institution,
            collegeId: req.body.collegeId
        };

        if (req.file) {
            const ext = path.extname(req.file.originalname) || '.jpg';
            const uploadResponse = await imagekit.files.upload({
                file: req.file.buffer.toString('base64'),
                fileName: `profile-${Date.now()}${ext}`,
                folder: '/profiles'
            });
            updates.profileImage = uploadResponse.url;
        }

        const principal = await Principal.findByIdAndUpdate(req.user._id, updates, {
            new: true,
            runValidators: true
        }).select('-password');

        res.status(200).json({
            success: true,
            data: principal
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
