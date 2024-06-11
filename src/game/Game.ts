import * as http from 'http';
import { Server, Socket } from 'socket.io';
import { Express } from 'express';
import { PORT } from '../globals';
import { EventEmitter } from 'events';
import { Pool } from 'pg';
import Logger from '../utils/Logger';
import World from './components/World';
import NetSession from '../utils/NetSession';
// Systems
import * as PhysicsSystem from './systems/Physics'
import * as WorldSystem from './systems/World'
import * as PlayerSystem from './systems/Player'
import * as GamemodeSystem from './systems/Gamemode'

class Game {
    // Configuration file
    public config: any;

    // Server hostname what can be show in the hub
    public hostname: string;

    // Maximum possible players in the game
    public maxPlayers: number;
    // Maximum possible connection to the server
    public maxConnections: number;
    
    // Simulation inteval (like do physics every 1/60 ms)
    public updateTime: number;

    // Socket.io server
    public socketServer?: Server | null;

    private updateIntervalId?: any;

    private httpServer?: http.Server | null;
    private logger: Logger;

    public emitter: EventEmitter;

    // PostgreSQL database server
    public db: Pool | null;

    // All connected sockets/players
    public sessions: NetSession[];

    // Contains all world/map tiles and entities
    public world: World;

    constructor() {
        this.hostname = "Uknown Server"

        this.maxPlayers = 16,
        this.maxConnections = 128,

        this.updateTime = 0.060; // 60 ms

        this.httpServer = null;
        this.socketServer = null;
        this.logger = new Logger('Game');

        this.emitter = new EventEmitter();

        this.db = null;

        this.sessions = [];
 
        this.world = new World(this);
    }

    /**
     * Create game networking
     */
    public createNetwork(express: Express) {
        if (this.httpServer == null)
            this.httpServer = http.createServer(express);

        if (this.socketServer == null)
            this.socketServer = new Server(this.httpServer, {
                cors: {origin: "*"}
            });
    }

    /**
     * Initialize game configuration
     * @param config json config
     */
    public initConfig(config: any) {
        this.config = config;

        // Set another data 
        this.hostname = this.config.network.hostname;
        this.maxPlayers = this.config.network.maxPlayers;
        this.maxConnections = this.config.network.maxConnections;
    }

    /**
     * Initialize game networking
     */
    public initNetwork() {
        if (this.httpServer == null || this.socketServer == null)
            return;

        // Connect to postgresql database
        // TODO/FIXME: Should be moved into config.json. I don't have time for this...
        this.db = new Pool({
            user: 'postgres',
            host: 'docnight.ru',
            database: 'webgame',
            password: '0530324jj',
            port: 5432,
        });

        // Handle connection info
        this.db.connect((err) => {
            if (err) {
                this.logger.error('Error connecting to PostgreSQL:', err);
                return;
            }
            this.logger.info('Connected to PostgreSQL');
        });

        // Host game server
        this.httpServer.listen(PORT, () => {
            this.logger.info(`Server listening on port ${this.config.network.port}`);

            // Send request to hub, if we want listing our server
            try {
                // Set address to hub connection
                const options = {
                    method: 'POST',
                    hostname: this.config.hub.address,
                    port: this.config.hub.port,
                    path: '/ping',
                    headers: {
                    'Content-Type': 'application/json'
                    }
                };
              
                // Make http request
                const req = http.request(options, (res) => {
                    this.logger.info(`Response status: ${res.statusCode}`);
                    this.logger.info(`Response headers: ${JSON.stringify(res.headers)}`);
                });        

                // Handle error
                req.on('error', (error) => {
                    this.logger.error(`Can't ping to hub: ${error}`);
                })

                // Write the connection table info
                req.write(JSON.stringify({ 
                    address: this.config.network.address,
                    port: this.config.network.port
                }));

                req.end();
            } catch (error) {
                //this.logger.error(error);
            }
        });

        // Listen if anyone connected
        this.socketServer.on('connection', (socket: Socket) => {
            // If we have max connections
            if (this.sessions.length >= this.config.network.maxConnections) {
                socket.disconnect(true);
                return;
            }

            this.logger.info(socket.id + ' connected');

            // Create new player session
            let session = new NetSession(socket);

            // ofc we should remove socket if he was disconnect 😀
            session.socket.on('disconnect', () => {
                this.sessions.splice(this.sessions.indexOf(session), 1);
                this.logger.info(session.socket.id + ' disconnected');

                // Emit event, because player disconnected 
                this.emitter.emit('onPlayerDisconnect', this, session)
            });

            // Emit event, because new player joined
            this.emitter.emit('onPlayerConnect', this, session);            

            // Add socket and manage it
            this.sessions.push(session);
        })
    }

    /**
     * Initialize systems and other staff
     */
    public initSystems() {
        PhysicsSystem.create(this);
        WorldSystem.create(this);
        PlayerSystem.create(this);
        GamemodeSystem.create(this);
    }

    /**
     * Start game logic
     */
    public start() {
        // Emit initialization for systems
        this.emitter.emit('onInit', this);

        // Emit... Maybe start? Why not /shrug
        this.emitter.emit('onStart', this);

        // Run update loop
        this.updateIntervalId = setInterval(() => {
            this.emitter.emit('onUpdate', this);
        }, this.updateTime);

        setInterval(() => {
            this.emitter.emit('onSecond', this);
        }, 1000)
    }

    /**
     * Stop/Shutdown game logic and exit
     */
    public stop() {
        clearInterval(this.updateIntervalId);
    }
}

export default Game;