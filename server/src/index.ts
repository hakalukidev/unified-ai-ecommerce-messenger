import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db";
import accountRoutes from "./routes/account.routes";
import authRoutes from "./routes/auth.routes";
import conversationRoutes from "./routes/conversation.routes";
import webhookRoutes from "./routes/webhook.routes";
import { mediaDir } from "./services/media.service";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 5000);
const defaultClientUrls = ["http://localhost:3000", "http://127.0.0.1:3000"];
const allowedOrigins = [
  ...defaultClientUrls,
  ...(process.env.CLIENT_URLS ?? process.env.CLIENT_URL ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

app.set("trust proxy", true);

app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    console.log(
      `[request] ${req.method} ${req.originalUrl} ${res.statusCode} ${
        Date.now() - startedAt
      }ms`,
    );
  });

  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
    allowedHeaders: [
      "Authorization",
      "Content-Type",
      "ngrok-skip-browser-warning",
    ],
  }),
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Publicly served AI voice-reply audio (needs to be fetchable by Meta's
// servers, so it's served from the same public SERVER_URL/ngrok tunnel).
app.use("/media", express.static(mediaDir));

app.use("/api/webhooks", webhookRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/auth", authRoutes);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

void startServer();
