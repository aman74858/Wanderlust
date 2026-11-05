const chatAgent = require('../services/chatAgent.js');

module.exports.respond = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'A valid message is required.'
      });
    }

    const trimmedMessage = message.trim().slice(0, 500); // Guard max length
    const result = await chatAgent.handleChatQuery(trimmedMessage, history || [], req.user || null);

    return res.json({
      success: true,
      reply: result.reply,
      listings: result.listings || [],
      suggestions: result.suggestions || []
    });
  } catch (error) {
    console.error('Chat controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while processing your message. Please try again.',
      reply: "I encountered an error trying to process your request. Please try asking again!",
      listings: [],
      suggestions: ["Show beach stays", "How do I book a stay?", "How to host?"]
    });
  }
};
