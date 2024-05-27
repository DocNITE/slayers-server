import Logger from "../../utils/Logger";
import Game from "../Game";

const logger = new Logger('World'); 

const TILES_PATH = 'res/prototypes/tiles/';

/**
 * Initialization of system
 * @param game game context
 */
function onInit(game: Game) {
    // TODO: Need implement save/load maps
    
    // Generate the grass
    for (let x = 0; x < 64; x++) {
        for (let y = 0; y < 64; y++) {
            // Create grass tile
            let tile = game.world.createTile(TILES_PATH + 'grass.json');
            tile.properties.x = x;
            tile.properties.y = y;
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

// generation
// Export function for creating system and place events
export function create(game: Game) {
    game.emitter.on('onInit', onInit);
    game.emitter.on('onStart', onStart);
    game.emitter.on('onUpdate', onUpdate);
}