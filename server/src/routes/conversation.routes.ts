import { Router } from "express";
import {
  getConversations,
  getMessages,
  sendReply,
  toggleAI,
} from "../controllers/conversation.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);
router.get("/", getConversations);
router.get("/:id/messages", getMessages);
router.post("/:id/reply", sendReply);
router.patch("/:id/ai-toggle", toggleAI);

export default router;
