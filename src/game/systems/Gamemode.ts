import Logger from "../../utils/Logger";
import Game from "../Game";
import Entity from "../components/Entity";
import { WOLRD_SIZE } from "./World";

let maxTime = 10;
let pregameMaxTime = 5;
let timeLeft = -1;

let coinSpawnCooldown = 3;
let maxCoins = 16;

let inGame = false;
let inChill = true;

/**
 * Logger for physics system 
 */ 
const logger: Logger = new Logger('Gamemode')

const COPPER_COIN_PATH = 'res/prototypes/entities/coins-copper.json';
const SILVER_COIN_PATH = 'res/prototypes/entities/coins-silver.json';
const GOLD_COIN_PATH = 'res/prototypes/entities/coins-gold.json';

function rand(maxVal: number) {
    const randomValue = Math.floor(Math.random() * maxVal);
    return randomValue;
}

function spawnCoin(game: Game, path: string, x: number, y: number) {

    let coinEnt = game.world.createEntity(path);

    logger.info('Created coin!');

    coinEnt.properties.physics.position.x = x;
    coinEnt.properties.physics.position.y = y;

    game.socketServer?.emit('Player_move', 
                        coinEnt.id, 
                        coinEnt.properties.physics.position.x,
                        coinEnt.properties.physics.position.y
                    );
}

/**
 * Initialization of system
 * @param game game context
 */
function onInit(game: Game) {
    logger.info('Initialized');
}


const takeQuery = {
    text: 'SELECT s_name, s_score FROM Score;',
};

function saveGame(game: Game) {
    game.sessions.forEach(session => {
        if (session.attachedEntity == null)
            return

        let entity = game.world.findEntityById(session.attachedEntity);
        if (entity == null)
            return 

        const query = {
            text: 'INSERT INTO Score (s_name, s_score) VALUES ($1, $2) ON CONFLICT (s_name) DO UPDATE SET s_score = Score.s_score + $2 WHERE Score.s_score < $2',
            values: [entity.properties.name, entity.properties.coins.amount],
          };
          
        game.db?.query(query, (err, res) => {
            if (err) {
                logger.error(err);
                return;
            }
            logger.info('Global score successfuly saved:', res)
        })
        
    });
}

/**
 * Update every game second
 * @param game game context
 */
function onSecond(game: Game) {
    if (inGame) {
        if (timeLeft < 1) {
            logger.info('End game! Getting results...');


            game.world.entities.forEach(entity => {
            if ('coin' in entity.properties)
                game.world.destroyEntity(entity);        
            });

            // Save round data
            saveGame(game);

            let oldCoins = 0;
            let winnerId = -1;
            // Remove coins from players
            game.world.entities.forEach(entity => {
                if (winnerId == -1)
                    winnerId = entity.id;
                if ('coins' in entity.properties) {
                    if (oldCoins < entity.properties.coins.amount) {
                        oldCoins = entity.properties.coins.amount;
                        winnerId = entity.id;
                    }
                    entity.properties.coins.amount = 0;
                    game.socketServer?.emit('Coin_set', entity.id, 0, -1);
                }
            });

            game.socketServer?.emit('Round_winner', winnerId, oldCoins)

            inGame = false;
            inChill = true;
            timeLeft = -1;
            return; 
        }

        if (rand(10) > 3) {
            logger.info('Randomed coin');
            let x = rand(2 + WOLRD_SIZE - 4);
            let y = rand(2 + WOLRD_SIZE - 4);
            let percent = rand(100);

            if (percent < 20) 
                spawnCoin(game, GOLD_COIN_PATH, x, y)
            else if (percent >= 20 && percent < 65)
                spawnCoin(game, SILVER_COIN_PATH, x, y)
            else 
                spawnCoin(game, COPPER_COIN_PATH, x, y)

        }

        timeLeft--;
    } else {
        if (inChill) {
            if (timeLeft == -1) {
                timeLeft = pregameMaxTime;
                logger.info('Chilling...')
            }

            if (timeLeft == 0) {
                inChill = false;
            }

            timeLeft--;
            return;
        } else if (timeLeft < 1 && game.sessions.length > 0) { 
            inGame = true;
            logger.info('Start game...');
            timeLeft = maxTime;
            return;
        } else {
            logger.info('Waiting players....');
            return;
        }

        timeLeft--;
    }
}

function onEntityCollide(game: Game, entity: Entity, target: Entity) {
    if (!('coin' in target.properties))
        return;

    entity.properties.coins.amount += target.properties.coin.amount;
    logger.info(`Added coins ${target.properties.coin.amount} to entity ${entity.id}`);

    game.socketServer?.emit('Coin_set', entity.id, entity.properties.coins.amount, target.properties.coin.amount);

    game.world.destroyEntity(target);
}

// Export function for creating system and place events
export function create(game: Game) {
    game.emitter.on('onInit', onInit);
    game.emitter.on('onSecond', onSecond);
    game.emitter.on('onEntityCollide', onEntityCollide)
}