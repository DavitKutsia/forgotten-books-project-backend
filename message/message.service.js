const Conversation = require("../models/conversation.model");
const Message = require("../models/message.model");
const User = require("../models/user.model");

// Send a message
async function sendMessage({ senderId, receiverId, content, productId, type = "text", fileName = null }) {
  // Find or create conversation between these two users (ignore productId)
  let conversation = await Conversation.findOne({
    members: { $all: [senderId, receiverId] },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      members: [senderId, receiverId],
      productId, // Store the initial product that brought them together
    });
  }

  const message = await Message.create({
    conversationId: conversation._id,
    senderId,
    content,
    messageType: type,
    fileName,
  });

  const sender = await User.findById(senderId).select("name");

  const messageResponse = {
    _id: message._id,
    conversationId: conversation._id,
    senderId: sender._id,
    senderName: sender.name,
    content,
    messageType: type,
    fileName,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };

  return {
    conversationId: conversation._id,
    message: messageResponse,
  };
}

// Get all messages in a conversation, populated with sender name
async function getMessages(conversationId) {
  const messages = await Message.find({ conversationId })
    .sort({ createdAt: 1 })
    .populate("senderId", "_id name");
  
  // Format consistently with socket responses
  return messages.map(m => ({
    _id: m._id,
    conversationId: m.conversationId,
    senderId: m.senderId._id,
    senderName: m.senderId.name,
    content: m.content,
    messageType: m.messageType,
    fileName: m.fileName,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  }));
}

// Get or create a conversation (ignore productId - one chat per user pair)
async function getOrCreateConversation(userId, receiverId, productId) {
  let conversation = await Conversation.findOne({
    members: { $all: [userId, receiverId] },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      members: [userId, receiverId],
      productId, // Store the initial product that brought them together
    });
  }

  return conversation;
}

// Get messages after a certain timestamp (for efficient polling)
async function getMessagesAfter(conversationId, afterTimestamp = null) {
  const query = { conversationId };
  
  if (afterTimestamp) {
    query.createdAt = { $gt: new Date(afterTimestamp) };
  }
  
  return Message.find(query)
    .sort({ createdAt: 1 })
    .populate("senderId", "name");
}

// Get all conversations of a user
async function getUserConversations(userId) {
  return Conversation.find({ members: userId })
    .populate("members", "name email")
    .populate("productId", "title")
    .sort({ updatedAt: -1 });
}

module.exports = {
  sendMessage,
  getMessages,
  getMessagesAfter,
  getOrCreateConversation,
  getUserConversations,
};