
class Logger {
    private name?: string;

    constructor(name?: string) {
        if (name == null)
            name = "";
        this.name = name;
    }

    private startGroup() {
        if (this.name != null)
            console.group(this.name);
    }

    private endGroup() {
        if (this.name != null)
            console.groupEnd();
    }

    private print(type: string, message?: any, ...optionalParams: any[]) {
        console.log(`[${type}] ${this.name}: ` + message, ...optionalParams);
    }

    /**
     * Print info into console
     */
    public info(message?: any, ...optionalParams: any[]) {
        this.print('INFO', message, ...optionalParams);
    }

    /**
     * Print error into console
     */
    public error(message?: any, ...optionalParams: any[]) {
        this.print('ERROR', message, ...optionalParams);
    }

    /**
     * Print warning into console 
     */
    public warn(message?: any, ...optionalParams: any[]) {
        this.print('WARNING', message, ...optionalParams)
    }
}

export default Logger;