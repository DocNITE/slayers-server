import { Socket } from 'socket.io';
import { parseIsolatedEntityName } from 'typescript';

const NET_PING_TIME = 3000;
const NET_PING_MAX_ATTEMPTS = 2;

class NetSession {
    // Player username
    public name: string;

    // Entity id what controlled by player
    public attachedEntity?: number | null;

    // Player socket
    public socket: Socket;
    // Ping attempts before disconnection
    public pingAttempt: number;

    private pingIntervalId?: any;

    constructor(socket: Socket) {
        const randomValue = Math.floor(Math.random() * (9000 - 1000 + 1)) + 1000;
        this.name = `Player${randomValue}`;

        this.attachedEntity = null;

        this.socket = socket;
        this.pingAttempt = 0;

        this.pingIntervalId = null;
    }

    /**
     * Start pinging to client. 
     * If ping was succesful - set pintAttempts to 0
     */
    public startPing() {
        // Don't do anything if timer was started
        if (this.pingIntervalId != null)
            return;

        // Receive ping from client. If this emitted - connection works
        this.socket.on('ping', () => {
            this.pingAttempt = 0;
        }); 

        // And do timer for sending 'ping' message to client
        this.pingIntervalId = setInterval(() => {
            this.socket.emit('ping');
            this.pingAttempt++;
            // If we have max or more ping attempts - disconnect socket
            if (this.pingAttempt >= 2) {
                this.socket.disconnect(true);
            }
        }, NET_PING_TIME)
    }
}

export default NetSession;