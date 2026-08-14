import { Router } from "express";
import {
  getFacebookPagesLogin,
  getMe,
  getInstagramBusinessLogin,
  handleFacebookPagesLoginCallback,
  handleInstagramBusinessLoginCallback,
  login,
  register,
  startFacebookPagesLogin,
  startInstagramBusinessLogin,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/facebook/callback", handleFacebookPagesLoginCallback);
router.get("/facebook/pages-login", getFacebookPagesLogin);
router.get(
  "/facebook/pages-login/start",
  authMiddleware,
  startFacebookPagesLogin,
);
router.get("/instagram/callback", handleInstagramBusinessLoginCallback);
router.get("/instagram/business-login", getInstagramBusinessLogin);
router.get(
  "/instagram/business-login/start",
  authMiddleware,
  startInstagramBusinessLogin,
);
router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);

export default router;
