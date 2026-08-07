const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Wires up Socket.io for real-time collaboration inside Spaces.
 * Clients join a room named after the space code and receive:
 *  - "new_messages" when someone asks a question (emitted from chat.routes.js)
 *  - "presence_update" when members join/leave
 *  - "typing" indicators
 */
function initSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error("User not found"));
      socket.user = { id: user._id.toString(), name: user.name };
      next();
    } catch (err) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join_space", (spaceCode) => {
      socket.join(spaceCode);
      socket.to(spaceCode).emit("presence_update", {
        type: "joined",
        user: socket.user,
      });
    });

    socket.on("leave_space", (spaceCode) => {
      socket.leave(spaceCode);
      socket.to(spaceCode).emit("presence_update", {
        type: "left",
        user: socket.user,
      });
    });

    socket.on("typing", ({ spaceCode, isTyping }) => {
      socket.to(spaceCode).emit("typing", { user: socket.user, isTyping });
    });

    socket.on("disconnect", () => {
      // Rooms are cleaned up automatically by Socket.io on disconnect
    });
  });
}

module.exports = initSocket;
