const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['ticket_raised', 'ticket_forwarded', 'ticket_resolved', 'ticket_updated', 'feedback_form'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    relatedTicket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        default: null
    },
    relatedFeedback: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Feedback',
        default: null
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Notification = mongoose.model('Notification', NotificationSchema);
module.exports = Notification;
