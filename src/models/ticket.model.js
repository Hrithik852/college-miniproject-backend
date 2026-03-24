const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        unique: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['infrastructure', 'academics', 'hygiene']
    },
    subject: {
        type: String,
        required: [true, 'Subject is required']
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    imageUrl: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Resolved', 'Re-opened'],
        default: 'Pending'
    },
    department: {
        type: String,
        required: true
    },
    forwardedToPrincipal: {
        type: Boolean,
        default: false
    },
    urgency: {
        type: String,
        enum: ['normal', 'high'],
        default: 'normal'
    },
    resolution: {
        actionTaken: String,
        remarks: String,
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        resolvedAt: Date
    }
    }, { timestamps: true });

    // Generate unique ticket ID before saving
    TicketSchema.pre('save', async function() {
    if (!this.ticketId) {
        const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit number
        this.ticketId = `STU-${randomNum}`;
    }
    });
const Ticket = mongoose.model('Ticket', TicketSchema);
module.exports = Ticket;