require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const initSocket = require("./socket/socketHandler");

const authRoutes = require("./routes/auth.routes");
const pdfRoutes = require("./routes/pdf.routes");
const collectionRoutes = require("./routes/collection.routes");
const spaceRoutes = require("./routes/space.routes");
const chatRoutes = require("./routes/chat.routes");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, credentials: true },
});

app.set("io", io);
initSocket(io);

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/pdfs", pdfRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/spaces", spaceRoutes);
app.use("/api/chat", chatRoutes);

// Central error handler (e.g. multer file-size/type errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Something went wrong" });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
