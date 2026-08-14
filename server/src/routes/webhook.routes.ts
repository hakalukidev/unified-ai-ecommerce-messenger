import { Router } from "express";
import {
  facebookWebhook,
  instagramWebhook,
  verifyWebhook,
  whatsappWebhook,
} from "../controllers/webhook.controller";

const router = Router();

router.get("/facebook", verifyWebhook);
router.post("/facebook", facebookWebhook);
router.get("/instagram", verifyWebhook);
router.post("/instagram", instagramWebhook);
router.get("/whatsapp", verifyWebhook);
router.post("/whatsapp", whatsappWebhook);

export default router;
