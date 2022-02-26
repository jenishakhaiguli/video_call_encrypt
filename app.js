const NodeRSA = require("node-rsa");
const key = new NodeRSA({ b: 512 });

const express = require("express");
//module
const http = require("http");

//for 3000 or heroku
//environment variable
const PORT = process.env.PORT || 3000;

const app = express();

//creating server and passing application
const server = http.createServer(app);
const io = require("socket.io")(server);

//middleware
app.use(express.static("public"));
app.use(require("cors")());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

let connectedPeers = [];

// //is called directly after the connection has been opened
io.on("connect", (socket) => {
  console.log("client connected to server");
  connectedPeers.push(socket.id);
  //for more than one connected user
  //if client connects to the server then the id will be printed
  console.log(connectedPeers);

  socket.on("encrypt_personal_code", (personalCode) => {
    const encryptedString = key.encrypt(personalCode, "base64");
    console.log("encrypted: ", encryptedString);

    io.to(personalCode).emit("encrypt_personal_code", encryptedString);
  });

  socket.on("decrypt_personal_code", (personalCode) => {
    const decryptedCode = key.decrypt(personalCode.data, "utf8");
    console.log("decrypted: ", decryptedCode);
    io.to(personalCode.id).emit("decrypt_personal_code", decryptedCode);
  });

  socket.on("pre-offer", (data) => {
    console.log("pre-offer-came-on-server-from-caller");
    // console.log(data);

    const { calleePersonalCode, callType } = data;

    //connectedPeer is the one who is being called
    const connectedPeer = connectedPeers.find((peerSocketId) => {
      return peerSocketId === calleePersonalCode;
    });

    console.log(`calling: ${connectedPeer}`);
    if (connectedPeers) {
      /////////////////////////////////////////////
      const data = {
        callerSocketId: socket.id,
        callType
      };
      console.log(
        "caller connected to server ... trying to connect callee/receiver",
        data
      );
      io.to(calleePersonalCode).emit("pre-offer", data);
    }
  });

  socket.on("pre-offer-answer", (data) => {
    console.log("pre offer answer came");
    // console.log(data);

    const connectedPeer = connectedPeers.find((peerSocketId) => {
      return peerSocketId === data.callerSocketId;
    });

    if (connectedPeer) {
      io.to(data.callerSocketId).emit("pre-offer-answer", data);
    }
  });
  //-------------3. sending webrrct offer------------------
  socket.on("webRTC-signalling", (data) => {
    const { connectedUserSocketId } = data;
    console.log("connectedUserSocketId: " + connectedUserSocketId);

    const connectedPeer = connectedPeers.find(
      (peerSocketId) => peerSocketId === connectedUserSocketId
    );

    if (connectedPeer) {
      io.to(connectedUserSocketId).emit("webRTC-signalling", data);
    }
  });

  //if internet connection lost
  socket.on("disconnect", () => {
    console.log("user disconnected");
    //console.log(socket.id);

    const newConnectedPeers = connectedPeers.filter((peerSocketId) => {
      return peerSocketId !== socket.id;
    });

    connectedPeers = newConnectedPeers;
    console.log(connectedPeers);
  });
});

server.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
