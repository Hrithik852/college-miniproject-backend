const express = require('express');
const { raiseTicket, getMyTickets, getAllTickets, resolveTicket } = require('../controllers/ticket.controllers');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');
const ticketRouter = express.Router();

// Student routes
ticketRouter.post('/raise', authMiddleware, roleMiddleware(['student']), raiseTicket);
ticketRouter.get('/my-tickets', authMiddleware, roleMiddleware(['student']), getMyTickets);

// HOD/Principal routes
ticketRouter.get('/all', authMiddleware, roleMiddleware(['hod', 'principal']), getAllTickets);
ticketRouter.put('/resolve/:ticketId', authMiddleware, roleMiddleware(['hod', 'principal']), resolveTicket);

module.exports = ticketRouter;
