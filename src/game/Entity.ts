import * as fs from 'fs';

class Entity {
    public id: number;
    public properties: any;

    // It shouldn't do something instead of 
    // initialize object. Because we should set id
    // of entity from another manager.
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

export default Entity;