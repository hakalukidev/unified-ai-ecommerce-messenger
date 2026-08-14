export type Platform = "facebook" | "instagram" | "whatsapp";

export type AccountStatus = "active" | "error" | "disconnected";

export type ConversationStatus = "active" | "escalated" | "resolved";

export type ConversationFilter =
  | "all"
  | "unread"
  | "escalated"
  | "resolved"
  | Platform;

export interface SellerSession {
  seller_id: string;
}

export interface AuthResponse {
  seller_id: string;
  token: string;
}

export interface InstagramBusinessLoginConfig {
  callback_url: string;
  ready: boolean;
  missing_configuration: string[];
  uses_business_config: boolean;
}

export interface FacebookPagesLoginConfig {
  callback_url: string;
  webhook_url?: string;
  verify_token_configured?: boolean;
  ready: boolean;
  missing_configuration: string[];
}

export interface InstagramBusinessLoginStartResponse {
  callback_url: string;
  login_url: string;
}

export interface FacebookPagesLoginStartResponse {
  callback_url: string;
  login_url: string;
}

export interface AccountRecord {
  _id: string;
  seller_id: string;
  platform: Platform;
  page_id: string;
  page_name: string;
  page_username?: string;
  access_token: string;
  ai_enabled: boolean;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationRecord {
  _id: string;
  account_id: string;
  platform: Platform;
  page_id: string;
  sender_id: string;
  sender_name: string;
  status: ConversationStatus;
  ai_enabled: boolean;
  unread_count: number;
  last_message_at: string;
  last_message_preview: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationView extends ConversationRecord {
  page_name: string;
  page_username?: string;
  account_status?: AccountStatus;
}

export interface MessageAttachment {
  type?: string;
  url?: string;
  mime_type?: string;
  file_name?: string;
}

export interface MessageRecord {
  _id: string;
  conversation_id: string;
  platform: Platform;
  page_id: string;
  sender_id: string;
  sender_name: string;
  message_id: string;
  direction: "inbound" | "outbound";
  source: "customer" | "ai_auto" | "manual" | "system";
  message_type:
    | "text"
    | "image"
    | "audio"
    | "video"
    | "file"
    | "button"
    | "postback";
  message_text: string;
  attachments: MessageAttachment[];
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReplyResponse {
  message: MessageRecord;
  delivery: unknown;
}

export interface LocalSummary {
  intent: string;
  questions: string;
  products: string;
  status: string;
}

export interface NewAccountInput {
  platform: Platform;
  page_id: string;
  page_name: string;
  page_username?: string;
  access_token: string;
  ai_enabled: boolean;
  status: AccountStatus;
}

export type UpdateAccountInput = Partial<
  Pick<
    AccountRecord,
    "page_name" | "page_username" | "access_token" | "ai_enabled" | "status"
  >
>;
