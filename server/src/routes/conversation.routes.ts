import { Router } from "express";
import multer from "multer";
import {
  getConversations,
  getMessages,
  sendAudioReply,
  sendReply,
  toggleAI,
  updateStatus,
} from "../controllers/conversation.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

const router = Router();

router.use(authMiddleware);
router.get("/", getConversations);
router.get("/:id/messages", getMessages);
router.post("/:id/reply", sendReply);
router.post("/:id/reply-audio", upload.single("file"), sendAudioReply);
router.patch("/:id/ai-toggle", toggleAI);
router.patch("/:id/status", updateStatus);

export default router;
