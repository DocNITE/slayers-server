import { Socket } from "socket.io";
import Logger from "../../utils/Logger";
import Game from "../Game";

/**
 * Logger for physics system 
 */ 
const logger: Logger = new Logger('Physics')

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

// TEST START
function onPlayerConnect(game: Game, socket: Socket) {
    logger.info("Player connected with " + socket.id)
}
// TEST END

// Export function for creating system and place events
export function create(game: Game) {
    game.emitter.on('onInit', onInit);
    game.emitter.on('onUpdate', onUpdate);
    // TEST START
    game.emitter.on('onPlayerConnect', onPlayerConnect)
    // TEST END
}