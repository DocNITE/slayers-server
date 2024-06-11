import { Socket } from "socket.io";
import Logger from "../../utils/Logger";
import Game from "../Game";
import NetSession from "../../utils/NetSession";
import World from "../components/World";
import Entity from "../components/Entity";

/**
 * Logger for player system 
 */ 
const logger: Logger = new Logger('Player')

const PLAYER_ENTITY_PATH = 'res/prototypes/entities/player.json';

function setName(game: Game, entity: Entity, name: string) {
    entity.properties.name = name;
    game.socketServer?.emit('Player_setName', entity.id, name);
}

function createPlayer(game: Game, session: NetSession) {
    let playerEnt = game.world.createEntity(PLAYER_ENTITY_PATH);
    if ('socketId' in playerEnt.properties) {
        // Set network socket id for entity
        playerEnt.properties.socketId = session.socket.id;
        // ...
        setName(game, playerEnt, session.name);

        // Attach entity on player
        session.attachedEntity = playerEnt.id;
        logger.info(`Player's entity ${playerEnt.id} marked on socket.id ${session.socket.id}`);

        // Emit when player was created
        game.emitter.emit('onPlayerCreated', game, session);
    } else {
        logger.warn(`Can't find socketId property in the entity instance. Entity can't be controlled`);
    }
}

function destroyPlayer(game: Game, session: NetSession) {
    if (session.attachedEntity != null) {
        // Destroy entity from the world
        game.world.destroyEntityById(session.attachedEntity);
        // Detach entity from player
        session.attachedEntity = null;
    }
}

/**
 * Initialization of system
 * @param game game context
 */
function onInit(game: Game) {
    logger.info('Initialized');
}

/**
 * Update every game simulation
 * @param game game context
 */
function onUpdate(game: Game) {
}

function onPlayerCreated(game: Game, session: NetSession) {
    // client should know his controlled entity
    session.socket.emit('Player_attachEntity', session.attachedEntity);
}

/**
 * Emit when player was connect on the server
 * @param game game context
 * @param session player network session
 */
function onPlayerConnect(game: Game, session: NetSession) {
    logger.info("Player connected to " + session.socket.id)

    createPlayer(game, session);

    session.socket.on('Player_move', (ev: string) => {
        game.emitter.emit('onPlayerMove', game, session, ev)
    });

    session.socket.on('Player_setName', (nickname: string) => {
        if (session.attachedEntity == null)
            return

        let entity = game.world.findEntityById(session.attachedEntity)
        if (entity != null)
            setName(game, entity, nickname);
    })
}

function onPlayerDisconnect(game: Game, session: NetSession) {
    logger.info("Player disconnected from " + session.socket.id)

    destroyPlayer(game, session);
}

function onEntityCreated(game: Game, world: World, entity: Entity ) {
    // Sync entity
    game.socketServer?.emit('Player_createEntity', {id: entity.id, properties: entity.properties})
}


function onEntityDestroyed(game: Game, world: World, entity: Entity ) {
    // Sync entity
    game.socketServer?.emit('Player_destroyEntity', {id: entity.id, properties: entity.properties})
}

// Export function for creating system and place events
export function create(game: Game) {
    game.emitter.on('onInit', onInit);
    game.emitter.on('onUpdate', onUpdate);
    game.emitter.on('onPlayerConnect', onPlayerConnect)
    game.emitter.on('onPlayerDisconnect', onPlayerDisconnect);
    game.emitter.on('onPlayerCreated', onPlayerCreated);
    game.emitter.on('onEntityCreated', onEntityCreated);
    game.emitter.on('onEntityDestroyed', onEntityDestroyed);
}
