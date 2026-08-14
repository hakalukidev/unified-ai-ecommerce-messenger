import { Response } from "express";
import Account from "../models/Account";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";

const getSellerId = (req: AuthenticatedRequest) => req.user?.sellerId;

export const getAccounts = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const sellerId = getSellerId(req);

  if (!sellerId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const accounts = await Account.find({ seller_id: sellerId }).sort({
    createdAt: -1,
  });

  return res.json(accounts);
};

export const createAccount = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const sellerId = getSellerId(req);

  if (!sellerId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const {
    platform,
    page_id,
    page_name,
    page_username,
    access_token,
    ai_enabled,
    status,
  } = req.body ?? {};

  if (!platform || !page_id || !page_name || !access_token) {
    return res.status(400).json({
      message: "platform, page_id, page_name, and access_token are required.",
    });
  }

  const account = await Account.findOneAndUpdate(
    { seller_id: sellerId, platform, page_id },
    {
      seller_id: sellerId,
      platform,
      page_id,
      page_name,
      page_username,
      access_token,
      ai_enabled,
      status,
    },
    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  return res.status(201).json(account);
};

export const updateAccount = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const sellerId = getSellerId(req);

  if (!sellerId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const account = await Account.findOneAndUpdate(
    {
      _id: req.params.id,
      seller_id: sellerId,
    },
    req.body ?? {},
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  if (!account) {
    return res.status(404).json({ message: "Account not found." });
  }

  return res.json(account);
};

export const deleteAccount = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const sellerId = getSellerId(req);

  if (!sellerId) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const account = await Account.findOneAndDelete({
    _id: req.params.id,
    seller_id: sellerId,
  });

  if (!account) {
    return res.status(404).json({ message: "Account not found." });
  }

  return res.status(204).send();
};
