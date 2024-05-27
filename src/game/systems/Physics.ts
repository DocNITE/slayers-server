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
    game.world.entities.forEach(entity => {
        if (!('physics' in entity.properties))
            return;
        
        let physicsComp = entity.properties.physics;

        // Update position
        physicsComp.position = {
            x: physicsComp.position.x + (physicsComp.velocity.x * physicsComp.walkSpeed), 
            y: physicsComp.position.y + (physicsComp.velocity.y * physicsComp.walkSpeed)
        }
    });
}

// Export function for creating system and place events
export function create(game: Game) {
    game.emitter.on('onInit', onInit);
    game.emitter.on('onUpdate', onUpdate);
}