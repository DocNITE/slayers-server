import * as http from 'http';
import { Server, Socket } from 'socket.io';
import { Express } from 'express';
import { PORT } from '../globals';
import { EventEmitter } from 'events';
import Logger from '../utils/Logger';
import * as Physics from './systems/Physics'
import Entity from './Entity';

class Game {
    // Server name
    public serverName: string;

    // Maximum players in the game
    public maxPlayers: number;
    // Maximum possible connections (for admins/devs)
    public maxConnections: number;

    // Simulation inteval (like do physics every 1/60 ms)
    public updateTime: number;

    private updateIntervalId?: any;

    private httpServer?: http.Server;
    private socketServer?: Server;
    private logger: Logger;

    public emitter: EventEmitter;

    // All connected sockets/players
    public sockets: Socket[];
    // All game entities like players, walls, objects
    public entities: Entity[];

    constructor() {
        // TODO: We should try read config file. 
        // If not - than give default values
        this.serverName = 'Slayers Game Server';
        this.maxPlayers = 16;
        this.maxConnections = 32;

        this.updateTime = 0.20; // 20 ms

        this.emitter = new EventEmitter();

        this.sockets = [];
        this.entities = [];

        this.logger = new Logger('Game');
    }

    /**
     * Create entity
     * @param filePath json file with properties(components) for entity
     * @returns entity
     */
    public createEntity(filePath?: string): Entity {
        let entity = new Entity();
        this.entities.push(entity);

        // Set actual entity id, equal like array index
        entity.id = this.entities.indexOf(entity);
        // Try to load json object from the file
        if (filePath != null) 
            entity.fromFile(filePath);

        this.logger.info('Created entity ' + entity.id);
        this.emitter.emit('onEntityCreated', this, entity);

        return entity;
    }

    /**
     * Destory entity
     * @param entity entity what should be deleted
     */
    public destroyEntity(entity: Entity) {
        this.entities.splice(this.entities.indexOf(entity), 1);

        this.logger.info(`Destroyed entity ${entity.id}`);
        this.emitter.emit('onEntityDestroyed', this, entity);
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
     * Initialize game networking
     */
    public initNetwork() {
        if (this.httpServer == null || this.socketServer == null)
            return;

        // Host game server
        this.httpServer.listen(PORT, () => {
            this.logger.info('Server listening on port 11000');
        });

        // Listen if anyone connected
        this.socketServer.on('connection', (socket: Socket) => {
            this.logger.info(socket.id + ' connected');

            // Emit event, because new player joined
            this.emitter.emit('onPlayerConnect', this, socket);

            // ofc we should remove socket if he was disconnect 😀
            socket.on('disconnect', () => {
                this.sockets.splice(this.sockets.indexOf(socket), 1);
                this.logger.info(socket.id + ' disconnected');

                // TODO: Destroy player entities with some system
                this.destroyEntity(playerEnt);
            });

            // TODO: Should be moved into system
            let playerEnt = this.createEntity('res/prototypes/player.json');
            if ('socketId' in playerEnt.properties) {
                playerEnt.properties.socketId = socket.id;
                this.logger.info(`Player's entity ${playerEnt.id} marked on socket.id ${socket.id}`);
            }

            this.logger.info(`Player ${socket.id} initialized on entity ${playerEnt.id}`);
            
            // Emit when player was created
            this.emitter.emit('onPlayerCreated', this, socket);

            // Add socket and manage it
            this.sockets.push(socket);
        })
    }

    /**
     * Initialize systems and other staff
     */
    public initSystems() {
        Physics.create(this);
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