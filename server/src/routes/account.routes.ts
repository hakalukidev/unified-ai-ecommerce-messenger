import { Router } from "express";
import {
  createAccount,
  deleteAccount,
  getAccounts,
  updateAccount,
} from "../controllers/account.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);
router.get("/", getAccounts);
router.post("/", createAccount);
router.patch("/:id", updateAccount);
router.delete("/:id", deleteAccount);

export default router;
