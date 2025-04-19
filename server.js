const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static("public"));

let waitingUsers = [];

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (interestString) => {
    const interests = interestString.trim() ? interestString.toLowerCase().split(/\s+/) : [];
    socket.interests = interests;
    socket.partner = null;

    let matched = false;

    // Try to match with same interest people
    for (let i = 0; i < waitingUsers.length; i++) {
      const other = waitingUsers[i];
      if (other.id !== socket.id && other.partner == null) {
        const common = socket.interests.find(interest =>
          other.interests.includes(interest)
        );
        if (common || (interests.length === 0 && other.interests.length === 0)) {
          matched = true;
          startChat(socket, other);
          waitingUsers.splice(i, 1);
          return;
        }
      }
    }

    // Not matched immediately, wait for 15 seconds before fallback
    waitingUsers.push(socket);
    socket.emit("waiting", "Waiting for someone with common interests...");

    const timeout = setTimeout(() => {
      if (socket.partner || !waitingUsers.includes(socket)) return;

      for (let i = 0; i < waitingUsers.length; i++) {
        const other = waitingUsers[i];
        if (other.id !== socket.id && other.partner == null) {
          matched = true;
          startChat(socket, other);
          waitingUsers = waitingUsers.filter(u => u !== socket && u !== other);
          break;
        }
      }

      if (!matched) {
        socket.emit("waiting", "Still waiting... no one available yet.");
      }
    }, 15000);
  });

  socket.on("message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("message", msg);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (socket.partner) {
      socket.partner.emit("partner-disconnected", "Stranger disconnected 💔");
      socket.partner.partner = null;
    }
    waitingUsers = waitingUsers.filter((u) => u.id !== socket.id);
  });

  socket.on("disconnect-manual", () => {
    if (socket.partner) {
      socket.partner.emit("partner-disconnected", "Stranger left the chat 💔");
      socket.partner.partner = null;
      socket.partner = null;
    }
    socket.emit("waiting", "You left the chat. Join again to find a new partner.");
    waitingUsers = waitingUsers.filter((u) => u.id !== socket.id);
  });
});

// Function to start chat
function startChat(user1, user2) {
  user1.partner = user2;
  user2.partner = user1;

  user1.emit("partner-found", "You're chatting with a stranger! 🎉");
  user2.emit("partner-found", "You're chatting with a stranger! 🎉");
}

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});
