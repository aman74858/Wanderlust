const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.js');

// Route for sending a message to the Wanderlust AI Chat Board Agent
router.post('/', chatController.respond);

module.exports = router;
