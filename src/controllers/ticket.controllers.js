const Ticket = require('../models/ticket.model');

// Student: Raise a new ticket
const raiseTicket = async (req, res) => {
    try {
        const { category, subject, description, imageUrl } = req.body;
        const newTicket = new Ticket({
            student: req.user.id,
            category,
            subject,
            description,
            imageUrl,
            department: req.user.department // Route based on student's department
        });
        await newTicket.save();
        res.status(201).json({
            message: "Ticket raised successfully",
            ticketId: newTicket.ticketId,
            ticket: newTicket
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Student: Get their own tickets
const getMyTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ student: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// HOD/Principal: Get tickets for their department/college
const getAllTickets = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'hod') {
            query.department = req.user.department;
        }
        const tickets = await Ticket.find(query).populate('student', 'username email department').sort({ createdAt: -1 });
        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// HOD/Principal: Resolve a ticket
const resolveTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { actionTaken, remarks } = req.body;

        const ticket = await Ticket.findOneAndUpdate({ ticketId: ticketId }, {
            status: 'resolved',
            resolution: {
                actionTaken,
                remarks,
                resolvedBy: req.user.id,
                resolvedAt: Date.now()
            }
        }, { new: true });

        if (!ticket) return res.status(404).json({ message: "Ticket not found" });
        res.status(200).json({ message: "Ticket resolved", ticket });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    raiseTicket,
    getMyTickets,
    getAllTickets,
    resolveTicket
};
