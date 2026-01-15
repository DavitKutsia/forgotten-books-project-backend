const router = require("express").Router();
const isAuth = require("../middlewares/isAuth.middleware");
const MessageService = require("./message.service");

// Get all conversations of the logged-in user
router.get("/conversations", isAuth, async (req, res) => {
  try {
    const conversations = await MessageService.getUserConversations(req.user.id);
    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load conversations" });
  }
});

// Get messages after a specific timestamp (for polling)
router.get("/:conversationId/after/:timestamp", isAuth, async (req, res) => {
  try {
    const messages = await MessageService.getMessagesAfter(
      req.params.conversationId,
      req.params.timestamp
    );
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load messages" });
  }
});

// Get all messages in a conversation
router.get("/:conversationId", isAuth, async (req, res) => {
  try {
    const messages = await MessageService.getMessages(req.params.conversationId);
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load messages" });
  }
});

// Get or create a conversation (productId optional, just for reference)
router.post("/get-or-create", isAuth, async (req, res) => {
  const { receiverId, productId } = req.body;
  console.log("GET-OR-CREATE endpoint called:", { userId: req.user.id, receiverId, productId });
  
  try {
    const conversation = await MessageService.getOrCreateConversation(
      req.user.id,
      receiverId,
      productId
    );

    console.log("Responding with conversationId:", conversation._id);
    res.json({ conversationId: conversation._id });
  } catch (err) {
    console.error("GET-OR-CREATE error:", err);
    res.status(500).json({ error: "Failed to get or create conversation" });
  }
});

// Send a message
router.post("/send", isAuth, async (req, res) => {
  const { receiverId, content, productId } = req.body;
  try {
    const result = await MessageService.sendMessage({
      senderId: req.user.id,
      receiverId,
      content,
      productId,
    });
    res.json(result.message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

module.exports = router;