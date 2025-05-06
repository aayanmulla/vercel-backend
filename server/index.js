const express = require("express");
const cors = require("cors");
const connectDB = require("./db/db");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Import routes
const signupRoutes = require("./routes/signup");
const authRoutes = require("./routes/authRoutes");
const sensorRoutes = require("./routes/sensorRoutes");
const parkingRoutes = require("./routes/parkingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const reservedRoutes = require("./routes/reservedRoutes");
const transporter = require("./routes/transporterRoutes");

const app = express();

console.log(
  "App starting in environment:",
  process.env.NODE_ENV || "development",
);
console.log("Current working directory:", process.cwd());

// Connect to MongoDB with timeout
const startServer = async () => {
  console.log("Attempting MongoDB connection...");
  try {
    await Promise.race([
      connectDB(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("MongoDB connection timeout")),
          10000,
        ),
      ),
    ]);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1); // Exit if connection fails
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      console.log("CORS origin check:", origin);
      callback(null, true); // Allow all for debugging, adjust later
    },
    credentials: true,
  }),
);

app.use(express.json());

app.get("/api/test", (req, res) => {
  console.log("Received /api/test");
  res.json({ message: "API is working!" });
});

app.get("/", (req, res) => {
  console.log("Received /");
  res.json({
    status: "Backend is running",
    timestamp: new Date().toISOString(),
  });
  console.log("Response sent for /");
});

// Routes
app.use("/api/signup", signupRoutes);
app.use("/api", authRoutes);
app.use("/api/sensors", sensorRoutes);
app.use("/api/parking", parkingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/slots", reservedRoutes);
app.use("/api/reserved", reservedRoutes);
app.use("/api", transporter);

app.get("/validate-token", (req, res) => {
  console.log("Validating token");
  const token = req.header("Authorization")?.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, decoded });
  } catch (err) {
    res.json({ valid: false, error: err.message });
  }
  console.log("Response sent for /validate-token");
});

app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({ error: "Something went wrong!" });
  console.log("Error response sent");
});

// Start the server (HTTP or WebSocket based on flag)
const startApplication = async () => {
  await startServer(); // Connect to MongoDB first

  if (process.argv.includes("--ws")) {
    const http = require("http");
    const WebSocket = require("ws");

    console.log("Starting WebSocket server...");
    const server = http.createServer(app);
    const wss = new WebSocket.Server({ server });

    wss.on("connection", (ws) => {
      console.log("WebSocket client connected");
      ws.on("message", (message) => {
        console.log("Received WebSocket message:", message);
        ws.send("Server received: " + message);
      });
      ws.on("close", () => console.log("WebSocket client disconnected"));
    });

    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => {
      console.log(`WebSocket server running on port ${PORT}`);
    });
  } else {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`HTTP server running on port ${PORT}`);
    });
  }
};

// Run the application
startApplication();
