const express = require('express');
const router = express.Router();
const { db } = require('../models/db');
const Message = require('../models/Message');

// Demo messages data
const demoMessages = [
  {
    conversation_id: 1,
    other_user_name: 'John Doe',
    last_message_date: new Date(),
    last_message_content: 'Hey there! This is a demo message from John.',
    unread_count: 2,
  },
  {
    conversation_id: 2,
    other_user_name: 'Jane Smith',
    last_message_date: new Date(),
    last_message_content: 'Hello! Just checking in about the project update.',
    unread_count: 0,
  }
];

const demoConversation = {
  id: 1,
  other_user: {
    id: 2,
    name: 'John Doe',
    avatar: '/images/default-avatar.jpg'
  },
  messages: [
    {
      id: 1,
      sender_id: 2,
      content: 'Hey there! How are you doing?',
      created_at: new Date(Date.now() - 3600000),
      is_read: true
    },
    {
      id: 2,
      sender_id: 1, // current user
      content: 'I\'m doing great! Thanks for asking.',
      created_at: new Date(Date.now() - 1800000),
      is_read: true
    },
    {
      id: 3,
      sender_id: 2,
      content: 'Just wanted to check if you got my last email?',
      created_at: new Date(),
      is_read: false
    }
  ]
};

// List all messages
router.get('/', async (req, res) => {
  if (!req.session.user) {
    req.flash('error_msg', 'Please log in to view messages');
    return res.redirect('/login');
  }

  // For demo purposes, return demo data if in development
  if (process.env.NODE_ENV === 'development') {
    return res.render('messages/list', { messages: demoMessages });
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

  // For demo purposes, return demo data if in development
  if (process.env.NODE_ENV === 'development') {
    return res.render('messages/view', { conversation: demoConversation });
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

// Send message (demo version)
router.post('/:id/send', async (req, res) => {
  if (!req.session.user) {
    req.flash('error_msg', 'Please log in to send messages');
    return res.redirect('/login');
  }

  // For demo purposes, just redirect back
  if (process.env.NODE_ENV === 'development') {
    return res.redirect(`/messages/${req.params.id}`);
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