import Logger from "../../utils/Logger";
import Entity from "./Entity";
import Game from "../Game";
import Tile from "./Tile";

class World {
    private game: Game;

    private tilesCount: number;
    private entitiesCount: number;

    // All world tile data
    public tiles: Tile[];
    // All game entities like players, walls, objects
    public entities: Entity[];

    private logger: Logger;

    constructor(game: Game) {
        this.game = game;

        this.tilesCount = 0;
        this.entitiesCount = 0;

        this.tiles = [];
        this.entities = [];

        this.logger = new Logger('World');
    }

    private findAvaibleEntityId(entity: Entity): number {
        const elements = this.entities;
        let minId = 0;

        for (let i = 0; i < elements.length; i++) {
            const entityElem = elements[i];
            
            if (minId != entityElem.id && (minId + 1) < (entityElem.id)) {
                return entityElem.id - 1;
            } else {
                minId = entityElem.id;
            }
        }

        // Return if it is single entity or allways is okay
        return elements.indexOf(entity);
    }

    private findAvaibleTileId(tile: Tile): number {
        const elements = this.tiles;
        let minId = 0;

        for (let i = 0; i < elements.length; i++) {
            const tileElem = elements[i];
            
            if (minId != tileElem.id && (minId + 1) < (tileElem.id)) {
                return tileElem.id - 1;
            } else {
                minId = tileElem.id;
            }
        }

        // Return if it is single entity or allways is okay
        return elements.indexOf(tile);
    }

    /**
     * Create entity
     * @param filePath json file with properties(components) for entity
     * @returns entity
     */
    public createEntity(filePath?: string): Entity {
        let entity = new Entity();
        this.entities.push(entity);

        this.entitiesCount++;

        // Set actual entity id, equal like array index
        entity.id = this.entitiesCount;
        // Try to load json object from the file
        if (filePath != null) 
            entity.fromFile(filePath);

        this.logger.info('Created entity ' + entity.id);
        this.game.emitter.emit('onEntityCreated', this.game, this, entity);

        return entity;
    }

    /**
     * Destory entity
     * @param entity entity what should be deleted
     */
    public destroyEntity(entity: Entity) {
        this.entities.splice(this.entities.indexOf(entity), 1);

        this.logger.info(`Destroyed entity ${entity.id}`);
        this.game.emitter.emit('onEntityDestroyed', this.game, this, entity);
    }

    /**
     * Destory entity by his id
     * @param id entity what should be deleted
     */
    public destroyEntityById(id: number) {
        let entity = this.findEntityById(id);
        if (entity != null)
            this.destroyEntity(entity);
    }

    /**
     * Try to get entity but his id
     * @param id entity id
     * @returns entity or null
     */
    public findEntityById(id: number): Entity | null {
        let result = null;
        this.entities.forEach(entity => {
            if (entity.id == id) {
                result = entity;
            }
        });
        return result;
    }
 
    /**
     * Create tile
     * @param filePath json file with properties(components) for tile
     * @returns tile
     */
    public createTile(filePath?: string): Tile {
        let tile = new Tile();
        this.tiles.push(tile);

        this.tilesCount++;

        // Set actual entity id, equal like array index
        tile.id = this.tilesCount;
        // Sort elements
        this.tiles.sort((a, b) => a.id - b.id);
        // Try to load json object from the file
        if (filePath != null) 
            tile.fromFile(filePath);

        this.logger.info('Created tile ' + tile.id);
        this.game.emitter.emit('onTileCreated', this.game, this, tile);

        return tile;
    }

    /**
     * Destory tile
     * @param tile entity what should be deleted
     */
    public destroyTile(tile: Tile) {
        this.tiles.splice(this.tiles.indexOf(tile), 1);
        // Sort elements
        this.tiles.sort((a, b) => a.id - b.id);

        this.logger.info(`Destroyed entity ${tile.id}`);
        this.game.emitter.emit('onTileDestroyed', this.game, this, tile);
    }

    /**
     * Destory tile by his id
     * @param id tile what should be deleted
     */
    public destroyTileById(id: number) {
        let tile = this.findTileById(id);
        if (tile != null)
            this.destroyEntity(tile);
    }

    /**
     * Try to get the tile but with his id
     * @param id tile id
     * @returns tile or null
     */
    public findTileById(id: number): Tile | null {
        let result = null;
        this.tiles.forEach(tile => {
            if (tile.id == id) {
                result = tile;
            }
        });
        return result;
    }
}

export default World;