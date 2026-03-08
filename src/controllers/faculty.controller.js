const { Feedback, FeedbackSubmission } = require('../models/feedback.model');
const { User } = require('../models/user.model');
const Notification = require('../models/notification.model');
const { sendFeedbackNotification } = require('../config/mailer');
const { analyzeCommentSentiment } = require('../utils/nlp');

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
    const token = buildStudentIdToken(feedback.batchYear, feedback.department);
    if (!token) return false;

    const identityParts = [student.username, student.email, student.collegeId]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

    return identityParts.some((value) => value.includes(token));
};

// Maps a text option to a 1-5 score based on common rating patterns or option position
const optionToScore = (answer, options) => {
    const lower = answer.toLowerCase().trim();
    const presetMap = {
        'excellent': 5, 'outstanding': 5, 'very good': 4, 'above average': 4,
        'good': 4, 'average': 3, 'fair': 2, 'below average': 2, 'poor': 1, 'bad': 1
    };
    if (presetMap[lower] !== undefined) return presetMap[lower];
    const idx = options.findIndex(o => o.toLowerCase().trim() === lower);
    if (idx === -1) return null;
    // First option = highest (5), last = lowest (1)
    return Math.max(1, 5 - Math.round((idx / Math.max(1, options.length - 1)) * 4));
};

// @desc    Get all feedback forms created by this faculty with stats
// @route   GET /api/faculty/feedbacks
// @access  Private (Faculty, HOD)
exports.getMyFeedbacks = async (req, res) => {
    try {
        const feedbacks = await Feedback.find({ createdBy: req.user._id }).sort('-createdAt');

        const feedbacksWithStats = await Promise.all(feedbacks.map(async (fb) => {
            const submissions = await FeedbackSubmission.find({ feedbackId: fb._id });
            const deptStudents = await User.find({
                role: 'student',
                department: fb.department
            }).select('username email collegeId csSection');
            const totalStudents = deptStudents.filter((student) => studentMatchesFeedbackTarget(student, fb)).length;

            // Calculate average rating across all submissions/questions
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

            return {
                ...fb.toObject(),
                submissionCount: submissions.length,
                totalStudents,
                isPending: submissions.length < totalStudents,
                averageRating: scoreCount > 0 ? parseFloat((totalScore / scoreCount).toFixed(1)) : null
            };
        }));

        const totalFeedbacks = feedbacks.length;
        const pendingCount = feedbacksWithStats.filter(f => f.isPending).length;

        // Overall average rating
        const ratedForms = feedbacksWithStats.filter(f => f.averageRating !== null);
        const overallAvg = ratedForms.length > 0
            ? parseFloat((ratedForms.reduce((s, f) => s + f.averageRating, 0) / ratedForms.length).toFixed(1))
            : null;

        res.status(200).json({
            success: true,
            data: feedbacksWithStats,
            stats: { totalFeedbacks, pendingCount, overallAvg }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all students in the same department as the logged-in faculty
// @route   GET /api/faculty/students
// @access  Private (Faculty, HOD)
exports.getMyStudents = async (req, res) => {
    try {
        const students = await User.find({
            role: 'student',
            department: req.user.department
        }).select('-password').sort('firstName lastName');

        res.status(200).json({ success: true, count: students.length, data: students });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get per-question poll results for a feedback form created by this faculty
// @route   GET /api/faculty/feedbacks/:id/results
// @access  Private (Faculty, HOD)
exports.getFeedbackResults = async (req, res) => {
    try {
        const feedback = await Feedback.findOne({
            _id: req.params.id,
            createdBy: req.user._id
        });

        if (!feedback) {
            return res.status(404).json({ success: false, message: 'Feedback form not found' });
        }

        const submissions = await FeedbackSubmission.find({ feedbackId: feedback._id });

        const analysis = feedback.questions.map(q => {
            const questionId = q._id.toString();
            const counts = {};
            q.options.forEach(opt => { counts[opt] = 0; });

            submissions.forEach(sub => {
                const response = sub.responses.find(r => r.questionId === questionId);
                if (response && counts.hasOwnProperty(response.answer)) {
                    counts[response.answer]++;
                }
            });

            return {
                question: q.text,
                options: q.options,
                counts,
                totalResponses: submissions.length
            };
        });

        res.status(200).json({
            success: true,
            data: {
                feedbackTitle: feedback.title,
                subject: feedback.subject,
                batchYear: feedback.batchYear,
                totalSubmissions: submissions.length,
                analysis,
                comments: submissions
                    .map(s => s.comment)
                    .filter(Boolean)
                    .map(text => ({ text, sentiment: analyzeCommentSentiment(text) }))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new feedback form
// @route   POST /api/faculty/feedbacks
// @access  Private (Faculty, HOD)
exports.createFeedbackForm = async (req, res) => {
    try {
        const { title, subject, batchYear, csSection, questions, deadline } = req.body;
        const department = req.user.department;

        if (!department) {
            return res.status(400).json({
                success: false,
                message: 'Faculty/HOD department is not available'
            });
        }

        if (department === 'cse' && !csSection) {
            return res.status(400).json({
                success: false,
                message: 'CS section is required for CSE department feedback'
            });
        }

        const studentIdToken = buildStudentIdToken(batchYear, department);
        if (!studentIdToken) {
            return res.status(400).json({
                success: false,
                message: 'Invalid batch year or department for student targeting'
            });
        }

        const feedback = await Feedback.create({
            title,
            subject,
            batchYear,
            department,
            csSection: department === 'cse' ? csSection : '',
            questions,
            deadline,
            createdBy: req.user._id
        });

        // Notify targeted students by ID token (e.g., 2023 + cse => 23cs)
        const students = await User.find({ role: 'student', department }).select('_id email username collegeId csSection');
        let targetStudents = students.filter((student) => studentMatchesFeedbackTarget(student, feedback));

        // Additionally filter by csSection for CSE feedbacks
        if (department === 'cse' && csSection) {
            targetStudents = targetStudents.filter((student) => student.csSection === csSection);
        }

        const notifPromises = targetStudents.map(s =>
            Notification.create({
                recipient: s._id,
                type: 'feedback_form',
                message: `A new feedback form "${title}" is available for ${batchYear} ${department.toUpperCase()} batch students. Please complete it before the deadline.`,
                relatedFeedback: feedback._id
            })
        );
        await Promise.all(notifPromises);

        // Send email notifications as well (best-effort)
        const emails = targetStudents.map(s => s.email).filter(Boolean);
        if (emails.length > 0) {
            sendFeedbackNotification(emails, title, `${batchYear} ${department.toUpperCase()}`).catch(() => {});
        }

        res.status(201).json({ success: true, data: feedback });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
