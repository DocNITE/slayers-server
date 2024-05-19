import * as fs from 'fs';
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { join } from 'path';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.static('res'));
const http = createServer(app);
const server = new Server(http, {
  cors: {origin: "*"}
});

const port = 11000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/*', (req, res) => {
  const filePath = join('res', req.url);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Not Found');
  }
});

// Host server resources
app.listen(port + 1, () => {
  console.log(`Resources server started on port ${port}`);
});

// Host game server
http.listen(port, () => {
  console.log('Server listening on port 11000');
});

server.on("connection", (socket) => {
    console.log("Connected" + socket.id);
})

console.log("Running!");
