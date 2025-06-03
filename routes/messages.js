const express = require('express');
const router = express.Router();
const { db } = require('../models/db');
const Message = require('../models/Message');

// List all messages
router.get('/', async (req, res) => {
  if (!req.session.user) {
    req.flash('error_msg', 'Please log in to view messages');
    return res.redirect('/login');
  }

  try {
    const userId = req.session.user.id;
    const messages = await Message.getConversations(userId);
    res.render('messages/list', { messages });
  } catch (error) {
    console.error('Messages error:', error);
    req.flash('error_msg', 'Error retrieving messages');
    res.redirect('/dashboard');
  }
});

// View conversation
router.get('/:id', async (req, res) => {
  if (!req.session.user) {
    req.flash('error_msg', 'Please log in to view messages');
    return res.redirect('/login');
  }

  try {
    const userId = req.session.user.id;
    const conversationId = req.params.id;
    
    // Mark messages as read
    await Message.markAsRead(conversationId, userId);
    
    const conversation = await Message.getConversation(conversationId, userId);
    
    if (!conversation) {
      req.flash('error_msg', 'Conversation not found');
      return res.redirect('/messages');
    }
    
    res.render('messages/view', { conversation });
  } catch (error) {
    console.error('Conversation error:', error);
    req.flash('error_msg', 'Error retrieving conversation');
    res.redirect('/messages');
  }
});

// Send message
router.post('/:id/send', async (req, res) => {
  if (!req.session.user) {
    req.flash('error_msg', 'Please log in to send messages');
    return res.redirect('/login');
  }

  try {
    const userId = req.session.user.id;
    const conversationId = req.params.id;
    const { message } = req.body;
    
    await Message.sendMessage(conversationId, userId, message);
    
    res.redirect(`/messages/${conversationId}`);
  } catch (error) {
    console.error('Send message error:', error);
    req.flash('error_msg', 'Error sending message');
    res.redirect(`/messages/${conversationId}`);
  }
});

module.exports = router;