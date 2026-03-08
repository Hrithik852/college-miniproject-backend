const { Student, User, HOD } = require('../models/user.model');
const { Feedback, FeedbackSubmission } = require('../models/feedback.model');
const Ticket = require('../models/ticket.model');
const Notification = require('../models/notification.model');
const imagekit = require('../config/imagekit');
const path = require('path');
const { detectUrgency, suggestCategory } = require('../utils/nlp');

const deptToIdCode = {
    cse: 'cs',
    ece: 'ec',
    eee: 'ee',
    ds: 'ds',
    mech: 'me'
};

const buildStudentIdToken = (batchYear, department) => {
    const year = String(batchYear || '').trim();
    const deptCode = deptToIdCode[String(department || '').toLowerCase()];
    if (!/^\d{4}$/.test(year) || !deptCode) return null;
    return `${year.slice(-2)}${deptCode}`.toLowerCase();
};

const studentMatchesFeedbackTarget = (student, feedback) => {
    // If feedback targets a specific CS section, student must be in that section
    if (feedback.csSection && student.csSection !== feedback.csSection) {
        return false;
    }

    const token = buildStudentIdToken(feedback.batchYear, feedback.department);
    if (!token) return false;

    const identityParts = [student.username, student.email, student.collegeId]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

    return identityParts.some((value) => value.includes(token));
};

// @desc    Get student profile
// @route   GET /api/student/profile
// @access  Private (Student)
const getProfile = async (req, res) => {
    try {
        const student = await Student.findById(req.user._id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update student profile
// @route   PUT /api/student/profile
// @access  Private (Student)
const updateProfile = async (req, res) => {
    try {
        const student = await Student.findById(req.user._id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Update fields
        student.username = req.body.username || student.username;
        student.firstName = req.body.firstName || student.firstName;
        student.lastName = req.body.lastName || student.lastName;
        student.phone = req.body.phone || student.phone;
        student.gender = req.body.gender || student.gender;
        student.institution = req.body.institution || student.institution;
        student.collegeId = req.body.collegeId || student.collegeId;

        if (req.body.password) {
            student.password = req.body.password;
        }
        if (req.file) {
            const ext = path.extname(req.file.originalname) || '.jpg';
            const uploadResponse = await imagekit.files.upload({
                file: req.file.buffer.toString('base64'),
                fileName: `profile-${Date.now()}${ext}`,
                folder: '/profiles'
            });
            student.profileImage = uploadResponse.url;
        }

        const updatedStudent = await student.save();
        res.json(updatedStudent);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get feedbacks targeted to the student
// @route   GET /api/student/feedbacks
// @access  Private (Student)
const getFeedbacks = async (req, res) => {
    try {
        const allDeptFeedbacks = await Feedback.find({
            department: req.user.department,
            isActive: true
        }).select('-createdBy');

        const feedbacks = allDeptFeedbacks.filter((feedback) =>
            studentMatchesFeedbackTarget(req.user, feedback)
        );

        // Check if already submitted
        const submissions = await FeedbackSubmission.find({ studentId: req.user._id });
        const submittedIds = submissions.map(s => s.feedbackId.toString());

        const feedbacksWithStatus = feedbacks.map(f => ({
            ...f.toObject(),
            isSubmitted: submittedIds.includes(f._id.toString())
        }));

        res.json(feedbacksWithStatus);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submit feedback
// @route   POST /api/student/feedbacks/:id/submit
// @access  Private (Student)
const submitFeedback = async (req, res) => {
    try {
        const { responses, comment } = req.body;
        const feedbackId = req.params.id;

        const feedback = await Feedback.findById(feedbackId);
        if (!feedback) {
            return res.status(404).json({ message: 'Feedback form not found' });
        }

        if (feedback.department !== req.user.department || !studentMatchesFeedbackTarget(req.user, feedback)) {
            return res.status(403).json({ message: 'You are not eligible to submit this feedback' });
        }

        const submission = new FeedbackSubmission({
            feedbackId,
            studentId: req.user._id,
            responses,
            comment
        });

        await submission.save();
        res.status(201).json({ message: 'Feedback submitted successfully' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already submitted feedback for this form' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Raise a ticket to HOD
// @route   POST /api/student/tickets
// @access  Private (Student)
const raiseTicket = async (req, res) => {
    try {
        const { category, subject, description } = req.body;

        let imageUrl = '';
        if (req.file) {
            const ext = path.extname(req.file.originalname) || '.jpg';
            const fileName = `ticket-${Date.now()}${ext}`;
            const uploadResponse = await imagekit.files.upload({
                file: req.file.buffer.toString('base64'),
                fileName,
                folder: '/tickets'
            });
            imageUrl = uploadResponse.url;
        }

        const ticket = new Ticket({
            student: req.user._id,
            category: category || suggestCategory(`${subject} ${description}`) || 'infrastructure',
            subject,
            description,
            department: req.user.department,
            imageUrl,
            urgency: detectUrgency(`${subject} ${description}`) ? 'high' : 'normal'
        });

        await ticket.save();

        // Notify HOD of this department
        const hod = await User.findOne({ role: 'hod', department: req.user.department });
        if (hod) {
            await Notification.create({
                recipient: hod._id,
                type: 'ticket_raised',
                message: `New ticket raised by ${req.user.firstName} ${req.user.lastName}: "${subject}"`,
                relatedTicket: ticket._id
            });
        }

        res.status(201).json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get student's tickets
// @route   GET /api/student/tickets
// @access  Private (Student)
const getMyTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ student: req.user._id }).sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    getFeedbacks,
    submitFeedback,
    raiseTicket,
    getMyTickets
};
