import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    sellerId: string;
    token: string;
  };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authorization token is required." });
    return;
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({ message: "JWT_SECRET is not configured." });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret);
    const payload = decoded as JwtPayload | string;

    if (typeof payload === "string") {
      res.status(401).json({ message: "Invalid token payload." });
      return;
    }

    const sellerId = payload.sellerId ?? payload.seller_id;

    if (typeof sellerId !== "string" || !sellerId) {
      res.status(401).json({ message: "Invalid token payload." });
      return;
    }

    req.user = { sellerId, token };
    next();
  } catch (error) {
    res.status(401).json({
      message: "Invalid or expired token.",
      error: error instanceof Error ? error.message : "Unknown authentication error.",
    });
  }
};
