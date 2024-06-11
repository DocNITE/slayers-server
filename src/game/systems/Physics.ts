import { Socket } from "socket.io";
import Logger from "../../utils/Logger";
import Game from "../Game";
import NetSession from "../../utils/NetSession";
import Entity from "../components/Entity";

/**
 * Logger for physics system 
 */ 
const logger: Logger = new Logger('Physics')

function checkCollision(game: Game, ent: Entity, x: number, y: number) {
    for (let i = 0; i < game.world.tiles.length; i++) {
        const tile = game.world.tiles[i];
                    
        if (tile.properties.x == x && tile.properties.y == y) {
            game.emitter.emit('onTileCollide', game, ent, tile);
            if ('collidable' in tile.properties) {
                return true;
            }
        }
    }

    for (let i = 0; i < game.world.entities.length; i++) {
        const entity = game.world.entities[i];
                    
        if (entity.properties.physics.position.x == x && entity.properties.physics.position.y == y) {
            game.emitter.emit('onEntityCollide', game, ent, entity);
            if ('collidable' in entity.properties.physics) {
                if (entity.properties.physics.collidable == true)
                    return true;
            }
        }
    }

    return false;
}

/**
 * Initialization of system
 * @param game game context
 */
function onInit(game: Game) {
    logger.info('Initialized');
}

function onPlayerMove(game: Game, session: NetSession, ev: string) {
     if (session.attachedEntity == null)
            return;

        let entity = game.world.findEntityById(session.attachedEntity);
        if (entity == null)
            return;

        logger.info(`Entity ${entity.id} moved to ${ev}`);

        let ex = entity.properties.physics.position.x;
        let ey = entity.properties.physics.position.y;
    
    let fliped = entity.properties.sprite.fliped;

        switch (ev) {
            case 'w':
                if (checkCollision(game, entity, ex, ey-1))
                    return;
                entity.properties.physics.position.y--;
                break; 
            case 'a':
                if (checkCollision(game, entity, ex - 1, ey))
                    return;
                entity.properties.sprite.fliped = true;
                entity.properties.physics.position.x--;
                fliped = true;
                break;
            case 's':
                if (checkCollision(game, entity, ex, ey+1))
                    return;
                entity.properties.physics.position.y++;
                break;
            case 'd': 
                if (checkCollision(game, entity, ex+1, ey))
                    return;
                entity.properties.sprite.fliped = false;
                entity.properties.physics.position.x++;
                break;
            default:
                break;
        }

        game.socketServer?.emit('Player_move', 
                            entity.id, 
                            entity.properties.physics.position.x,
            entity.properties.physics.position.y,
                            entity.properties.sprite.fliped
                        );
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
    game.emitter.on('onPlayerMove', onPlayerMove)
}