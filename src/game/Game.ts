import * as http from 'http';
import { Server, Socket } from 'socket.io';
import { Express } from 'express';
import { PORT } from '../globals';
import { EventEmitter } from 'events';
import Logger from '../utils/Logger';
import World from './World';
import Entity from './Entity';
import NetSession from '../utils/NetSession';
// Systems
import * as PhysicsSystem from './systems/Physics'
import * as PlayerSystem from './systems/Player'
import * as WorldSystem from './systems/World'

class Game {
    // Configuration file
    public config: any;
    
    // Simulation inteval (like do physics every 1/60 ms)
    public updateTime: number;

    // Socket.io server
    public socketServer?: Server | null;

    private updateIntervalId?: any;

    private httpServer?: http.Server | null;
    private logger: Logger;

    public emitter: EventEmitter;

    // All connected sockets/players
    public sessions: NetSession[];

    // Contains all world/map tiles and entities
    public world: World;

    constructor() {
        this.updateTime = 0.20; // 20 ms

        this.httpServer = null;
        this.socketServer = null;
        this.logger = new Logger('Game');

        this.emitter = new EventEmitter();

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
    }

    /**
     * Initialize game networking
     */
    public initNetwork() {
        if (this.httpServer == null || this.socketServer == null)
            return;

        // Host game server
        this.httpServer.listen(PORT, () => {
            this.logger.info(`Server listening on port ${this.config.network.port}`);
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
        PlayerSystem.create(this);
        WorldSystem.create(this);
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
    }

    /**
     * Stop/Shutdown game logic and exit
     */
    public stop() {
        clearInterval(this.updateIntervalId);
    }
}

export default Game;