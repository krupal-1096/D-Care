import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { adminRouter } from "./routes/admin";
import { doctorRouter } from "./routes/doctor";
import { authRouter } from "./routes/auth";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 4000;
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "").split(",").filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true
  })
);
app.use(
  express.json({
    limit: "10mb" // allow base64 images from admin UI
  })
);

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", authRouter);
app.use("/admin", adminRouter);
app.use("/doctor", doctorRouter);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

app.listen(port, () => {
});
