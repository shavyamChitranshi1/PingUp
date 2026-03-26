const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");

const Message = require("./models/message.js");
const authRoutes = require("./routes/auth");
const verifyToken = require("./middleware/auth.js");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const users = {};

app.use("/auth", authRoutes);

io.on("connection", (socket) => {
  console.log("User connected");

  const token = socket.handshake.auth.token;
  const userData = verifyToken(token);

  if (!userData) {
    console.log("Invalid Token");
    socket.disconnect();
    return;
  }

  const username = userData.username;
  socket.username = username;

  users[username] = socket.id;

  socket.emit("me", username);

  io.emit("User_List", users);

 
  socket.on("private_message", async ({ to, message }) => {
    const from = socket.username;
    const room = getRoom(from, to);

    socket.join(room); 

    await Message.create({
      from,
      to,
      message,
      time: new Date(), 
    });

    io.to(room).emit("receive_message", {
      from,
      message,
    });
  });


  socket.on("load_messages", async (otherUser) => {
    const myName = socket.username;
    const room = getRoom(myName, otherUser);

    socket.join(room);

    const messages = await Message.find({
      $or: [
        { from: myName, to: otherUser },
        { from: otherUser, to: myName },
      ],
    }).sort({ time: 1 });

    socket.emit("chat_history", messages);
  });


  socket.on("disconnect", () => {
    delete users[socket.username]; 

    io.emit("User_List", users);
  });

  function getRoom(user1, user2) {
    return [user1, user2].sort().join("_");
  }
});

mongoose.connect("mongodb://localhost:27017/PingUp_DB")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

server.listen(5000, () => {
  console.log("Server running on port 5000");
});