import Logger from "../../utils/Logger";
import NetSession from "../../utils/NetSession";
import Game from "../Game";

const logger = new Logger('World'); 

const TILES_PATH = 'res/prototypes/tiles/';

function createTile(game: Game, x: number, y: number, file: string) {
    let tile = game.world.createTile(TILES_PATH + file);
    tile.properties.x = x;
    tile.properties.y = y;
}

/**
 * Initialization of system
 * @param game game context
 */
function onInit(game: Game) {
    // TODO: Need implement save/load maps
    
    const worldSize = 12;

    createTile(game, 0, 0, 'cobblestone.json');
    createTile(game, 0, worldSize-1, 'cobblestone.json');
    createTile(game, worldSize-1, 0, 'cobblestone.json');
    createTile(game, worldSize-1, worldSize-1, 'cobblestone.json');

    // Generate left mid walls
    for (let y = 1; y < (worldSize-1); y++) {
        // Create a wall tile
        createTile(game, 0, y, 'cobblestone.json');
    } 
    // Generate right mid walls
    for (let y = 1; y < (worldSize-1); y++) {
        // Create a wall tile
        createTile(game, worldSize-1, y, 'cobblestone.json');
    } 
    // Generate mid up walls
    for (let x = 1; x < (worldSize-1); x++) {
        // Create a wall tile
        createTile(game, x, 0, 'cobblestone.json');
    }
    // Generate mid down walls
    for (let x = 1; x < (worldSize-1); x++) {
        // Create a wall tile
        createTile(game, x, worldSize-1, 'cobblestone.json');
    }
    // Generate cobblestone
    for (let x = 1; x < (worldSize-1); x++) {
        for (let y = 1; y < (worldSize-1); y++) {
            // Create cobblestone tile
            createTile(game, x, y, 'grass.json');
        } 
    }

    logger.info('Initialized');
}

/**
 * Start system
 * @param game game context
 */
function onStart(game: Game) {
    logger.info('Started');
}

/**
 * Update every game simulation
 * @param game game context
 */
function onUpdate(game: Game) {
}

function onSync(game: Game, session: NetSession) {
    let world: any = {tiles: [], entities: []};

    // Add all tiles from the server
    game.world.tiles.forEach(tile => {
        let tilejson = {id: tile.id, properties: tile.properties};
        
        world.tiles.push(tilejson);
    });

    // Add all entities from the server
    game.world.entities.forEach(entity => {
        let entityjson = {id: entity.id, properties: entity.properties};
        
        world.entities.push(entityjson);
    });

    logger.info('Sync world data with ' + session.socket.id);

    // Send packet to client
    session.socket.emit('World_onSync', world)
}

/**
 * Emit when player was connect on the server
 * @param game game context
 * @param session player network session
 */
function onPlayerConnect(game: Game, session: NetSession) {
    session.socket.on('World_sync', () => {
        onSync(game, session);
    });
}

// Export function for creating system and place events
export function create(game: Game) {
    game.emitter.on('onInit', onInit);
    game.emitter.on('onStart', onStart);
    game.emitter.on('onUpdate', onUpdate);
    game.emitter.on('onPlayerConnect', onPlayerConnect)
}