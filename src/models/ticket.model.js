const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
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
    asset: {
        type: String,
        required: [true, 'Asset is required'] // e.g., Fan, Projector, Bench
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
        enum: ['open', 'in-progress', 'resolved', 're-opened'],
        default: 'open'
    },
    department: {
        type: String,
        required: true // Routing to relevant HOD
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

const Ticket = mongoose.model('Ticket', TicketSchema);
module.exports = Ticket;
