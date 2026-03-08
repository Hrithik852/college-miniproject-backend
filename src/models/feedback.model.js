const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required']
    },
    subject: {
        type: String,
        required: [true, 'Subject is required']
    },
    batch: {
        type: String,
        default: ''
    },
    batchYear: {
        type: String,
        required: [true, 'Batch year is required'],
        match: [/^\d{4}$/, 'Batch year must be a 4-digit year']
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        enum: ['cse', 'mech', 'eee', 'ece']
    },
    csSection: {
        type: String,
        enum: {
            values: ['CS A', 'CS B', 'DS', ''],
            message: '{VALUE} is not a valid CS section'
        },
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    questions: [{
        text: String,
        options: [String] // e.g., ['Excellent', 'Above Average', ...]
    }],
    deadline: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const FeedbackSubmissionSchema = new mongoose.Schema({
    feedbackId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Feedback',
        required: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    responses: [{
        questionId: String,
        answer: String
    }],
    comment: String
}, { timestamps: true });

// Ensure a student can only submit once per feedback form
FeedbackSubmissionSchema.index({ feedbackId: 1, studentId: 1 }, { unique: true });

const Feedback = mongoose.model('Feedback', FeedbackSchema);
const FeedbackSubmission = mongoose.model('FeedbackSubmission', FeedbackSubmissionSchema);

module.exports = { Feedback, FeedbackSubmission };
