const { Student, Faculty, HOD, User } = require('../models/user.model');
const Ticket = require('../models/ticket.model');
const { Feedback, FeedbackSubmission } = require('../models/feedback.model');
const Notification = require('../models/notification.model');
const mongoose = require('mongoose');
const imagekit = require('../config/imagekit');
const path = require('path');
const { analyzeCommentSentiment } = require('../utils/nlp');

const optionToScore = (answer, options) => {
    const lower = answer.toLowerCase().trim();
    const presetMap = {
        'excellent': 5, 'outstanding': 5, 'very good': 4, 'above average': 4,
        'good': 4, 'average': 3, 'fair': 2, 'below average': 2, 'poor': 1, 'bad': 1
    };
    if (presetMap[lower] !== undefined) return presetMap[lower];
    const idx = options.findIndex(o => o.toLowerCase().trim() === lower);
    if (idx === -1) return null;
    return Math.max(1, 5 - Math.round((idx / Math.max(1, options.length - 1)) * 4));
};

// @desc    Get all students in HOD's department
// @route   GET /api/hod/students
// @access  Private (HOD)
exports.getDepartmentStudents = async (req, res) => {
    try {
        if (!req.user.department) {
            return res.status(400).json({ success: false, message: 'HOD has no department assigned' });
        }
        
        const dept = req.user.department.toLowerCase().trim();
        console.log(`Fetching students for department: ${dept}`);
        
        // Using User model directly with role filter to be safer
        const students = await User.find({ 
            department: dept,
            role: 'student'
        }).select('-password');
        
        res.status(200).json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all faculty in HOD's department
// @route   GET /api/hod/faculty
// @access  Private (HOD)
exports.getDepartmentFaculty = async (req, res) => {
    try {
        if (!req.user.department) {
            return res.status(400).json({ success: false, message: 'HOD has no department assigned' });
        }

        const dept = req.user.department.toLowerCase().trim();
        console.log(`Fetching faculty for department: ${dept}`);

        const faculty = await User.find({ 
            department: dept,
            role: 'faculty'
        }).select('-password');
        
        res.status(200).json({
            success: true,
            count: faculty.length,
            data: faculty
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all tickets in HOD's department
// @route   GET /api/hod/tickets
// @access  Private (HOD)
exports.getDepartmentTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ department: req.user.department })
            .populate('student', 'firstName lastName email collegeId')
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

// @desc    Update ticket status
// @route   PATCH /api/hod/tickets/:id/status
// @access  Private (HOD)
exports.updateTicketStatus = async (req, res) => {
    try {
        const { status, actionTaken, remarks } = req.body;
        
        const ticket = await Ticket.findOne({ 
            _id: req.params.id, 
            department: req.user.department 
        });

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found in your department' });
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

        // Notify the student about the ticket update
        await Notification.create({
            recipient: ticket.student,
            type: 'ticket_updated',
            message: `Your grievance ticket "${ticket.subject}" status updated to "${ticket.status}"${remarks ? `: ${remarks}` : ''}`,
            relatedTicket: ticket._id
        });

        res.status(200).json({ success: true, data: ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Forward ticket to Principal
// @route   POST /api/hod/tickets/:id/forward
// @access  Private (HOD)
exports.forwardTicketToPrincipal = async (req, res) => {
    try {
        const ticket = await Ticket.findOne({ 
            _id: req.params.id, 
            department: req.user.department 
        });

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        ticket.forwardedToPrincipal = true;
        ticket.status = 'In Progress';
        
        await ticket.save();

        // Notify all principal(s)
        const principals = await User.find({ role: 'principal' });
        const notifPromises = principals.map(p =>
            Notification.create({
                recipient: p._id,
                type: 'ticket_forwarded',
                message: `HOD ${req.user.firstName} ${req.user.lastName} forwarded ticket "${ticket.subject}" from ${ticket.department} department`,
                relatedTicket: ticket._id
            })
        );
        await Promise.all(notifPromises);

        res.status(200).json({
            success: true,
            message: 'Ticket forwarded to Principal successfully',
            data: ticket
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all feedback forms created by faculty in the department
// @route   GET /api/hod/faculty-feedback
// @access  Private (HOD)
exports.getDepartmentFeedbackForms = async (req, res) => {
    try {
        const feedbacks = await Feedback.find({ department: req.user.department })
            .populate('createdBy', 'firstName lastName')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: feedbacks.length,
            data: feedbacks
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get aggregated results for a specific feedback form
// @route   GET /api/hod/feedback-results/:formId
// @access  Private (HOD)
exports.getFeedbackResults = async (req, res) => {
    try {
        const feedback = await Feedback.findOne({ 
            _id: req.params.formId, 
            department: req.user.department 
        });

        if (!feedback) {
            return res.status(404).json({ success: false, message: 'Feedback form not found' });
        }

        const submissions = await FeedbackSubmission.find({ feedbackId: req.params.formId });
        
        // Simple aggregation logic
        const results = feedback.questions.map(q => {
            const questionId = q._id.toString();
            const optionCounts = {};
            q.options.forEach(opt => optionCounts[opt] = 0);

            submissions.forEach(sub => {
                const response = sub.responses.find(r => r.questionId === questionId);
                if (response && optionCounts.hasOwnProperty(response.answer)) {
                    optionCounts[response.answer]++;
                }
            });

            return {
                question: q.text,
                counts: optionCounts,
                totalResponses: submissions.length
            };
        });

        res.status(200).json({
            success: true,
            data: {
                feedbackTitle: feedback.title,
                subject: feedback.subject,
                totalSubmissions: submissions.length,
                analysis: results,
                comments: submissions.map(s => s.comment).filter(c => c)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all department feedback forms with stats + overall sentiment
// @route   GET /api/hod/feedbacks-dashboard
// @access  Private (HOD)
exports.getDepartmentFeedbackDashboard = async (req, res) => {
    try {
        const feedbacks = await Feedback.find({ department: req.user.department })
            .populate('createdBy', 'firstName lastName')
            .sort('-createdAt');

        let overallSentiment = { positive: 0, neutral: 0, negative: 0 };
        let totalResponses = 0;

        const feedbacksWithStats = await Promise.all(feedbacks.map(async (fb) => {
            const submissions = await FeedbackSubmission.find({ feedbackId: fb._id });

            // Average rating
            let totalScore = 0, scoreCount = 0;
            submissions.forEach(sub => {
                sub.responses.forEach(resp => {
                    const question = fb.questions.find(q => q._id.toString() === resp.questionId);
                    if (question) {
                        const score = optionToScore(resp.answer, question.options);
                        if (score !== null) { totalScore += score; scoreCount++; }
                    }
                });
            });

            // Sentiment per form
            const comments = submissions.map(s => s.comment).filter(Boolean);
            const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
            comments.forEach(text => {
                const { label } = analyzeCommentSentiment(text);
                sentimentCounts[label]++;
                overallSentiment[label]++;
            });

            totalResponses += submissions.length;

            return {
                ...fb.toObject(),
                submissionCount: submissions.length,
                averageRating: scoreCount > 0 ? parseFloat((totalScore / scoreCount).toFixed(1)) : null,
                sentiment: sentimentCounts
            };
        }));

        res.status(200).json({
            success: true,
            data: feedbacksWithStats,
            summary: {
                totalForms: feedbacks.length,
                totalResponses,
                overallSentiment,
                overallAvgRating: (() => {
                    const rated = feedbacksWithStats.filter(f => f.averageRating !== null);
                    return rated.length > 0
                        ? parseFloat((rated.reduce((s, f) => s + f.averageRating, 0) / rated.length).toFixed(1))
                        : null;
                })()
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a feedback form (HOD can delete any in their department)
// @route   DELETE /api/hod/feedbacks/:id
// @access  Private (HOD)
exports.deleteFeedbackForm = async (req, res) => {
    try {
        const feedback = await Feedback.findOne({
            _id: req.params.id,
            department: req.user.department
        });

        if (!feedback) {
            return res.status(404).json({ success: false, message: 'Feedback form not found in your department' });
        }

        await FeedbackSubmission.deleteMany({ feedbackId: feedback._id });
        await Notification.deleteMany({ relatedFeedback: feedback._id });
        await feedback.deleteOne();

        res.status(200).json({ success: true, message: 'Feedback form deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update HOD profile
// @route   PUT /api/hod/profile
// @access  Private (HOD)
exports.updateHODProfile = async (req, res) => {
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

        const hod = await HOD.findByIdAndUpdate(req.user._id, updates, {
            new: true,
            runValidators: true
        }).select('-password');

        res.status(200).json({
            success: true,
            data: hod
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
