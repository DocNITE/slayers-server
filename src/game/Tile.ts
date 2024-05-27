import * as fs from 'fs';

class Tile {
    public id: number;
    public properties: any;

    constructor() {
        this.id = -1;
        this.properties = {};
    }

    public fromFile(filePath: string) {
        try {    
            this.properties = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (error) {}
    }
}

export default Tile;