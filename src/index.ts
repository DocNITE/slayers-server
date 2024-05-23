import * as fs from 'fs';
import express, { Request, Response } from 'express';
import { join } from 'path';
import cors from 'cors';
import Game from './game/Game';
import Logger from './utils/Logger';
import { PORT, RES_PORT } from './globals';

const logger = new Logger("Express");

const app = express();
app.use(cors());
app.use(express.static('res'));

// FIXME: I think it should be works better than
// my solution of CORS connection...
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Give response for giving some res file
app.get('/*', (req, res) => {
  const filePath = join('res', req.url);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Not Found');
  }
});

// Host server resources
app.listen(RES_PORT + 1, () => {
  logger.info(`Resources server started on port ${RES_PORT}`);
});

// Create game context
let game = new Game();
game.createNetwork(app);
game.initNetwork();
game.initSystems();
game.start();

/*
  I don't sure, should we have feature for shutdown 
  game server? Because i planned for next steps:
  1. Compile+Run server
  2. Stay away from that
  3. Shutdown using Ctrl+C or give errors
*/
