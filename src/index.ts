import * as fs from 'fs';
import express, { Request, Response } from 'express';
import { join } from 'path';
import cors from 'cors';
import Game from './game/Game';
import Logger from './utils/Logger';
import { PORT, RES_PORT } from './globals';

/*
pool.connect((err) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err);
    return;
  }
  console.log('Connected to PostgreSQL');

  // Выполните SQL-запрос
  pool.query('SELECT * FROM your_table', (err, result) => {
    if (err) {
      console.error('Error running query:', err);
      return;
    }
    console.log('Result:', result);
  });
});
*/

// Express logger
const logger = new Logger("Express");
// JSON server configuration file
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// Create express application
const app = express();
app.use(cors());
app.use(express.static('public'));

// FIXME: I think it should be works better than
// my solution of CORS connection...
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Give response for giving some res file
app.get('/public', (req, res) => {
  const filePath = join('public', req.url);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Not Found');
  }
});

// Try to login
app.post('/login', (req, res) => {
  logger.warn(req.body)
  if (!req.body)
    return;

  const { username, password } = req.body;

  if (username != 'DocNight') {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
})

// Give response for return connection info
app.get('/info', (req, res) => {
  const data = { 
    hostname: game.hostname, 

    maxPlayers: game.maxPlayers,
    online: game.sessions.length,
    
    port: config.network.port,
    address: config.network.address,
  }
  res.json(data);
})

// Host server resources
app.listen(config.network.port + 1, () => {
  logger.info(`Resources server started on port ${config.network.port + 1}`);
});

// Create game context
const game = new Game();
game.initConfig(config);
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
