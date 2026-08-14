import { Model, Schema, model, models } from "mongoose";

export type Platform = "facebook" | "instagram" | "whatsapp";
export type AccountStatus = "active" | "error" | "disconnected";

export interface AccountDocument {
  seller_id: string;
  platform: Platform;
  page_id: string;
  page_name: string;
  page_username?: string;
  access_token: string;
  ai_enabled: boolean;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
}

const accountSchema = new Schema<AccountDocument>(
  {
    seller_id: { type: String, required: true, trim: true },
    platform: {
      type: String,
      enum: ["facebook", "instagram", "whatsapp"],
      required: true,
    },
    page_id: { type: String, required: true, trim: true },
    page_name: { type: String, required: true, trim: true },
    page_username: { type: String, trim: true },
    access_token: { type: String, required: true, trim: true },
    ai_enabled: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["active", "error", "disconnected"],
      default: "active",
    },
  },
  { timestamps: true },
);

accountSchema.index({ seller_id: 1, platform: 1, page_id: 1 }, { unique: true });

const Account =
  (models.Account as Model<AccountDocument> | undefined) ??
  model<AccountDocument>("Account", accountSchema);

export default Account;
