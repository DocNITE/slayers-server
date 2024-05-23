export interface Event {
    type: string;
    data: any;
}

export class EventEmitter {
    private events: { [key: string]: (event: Event) => void };
  
    constructor() {
      this.events = {};
    }
  
    on(eventName: string, callback: (event: Event) => void) {
      this.events[eventName] = callback;
    }
  
    emit(eventName: string, data: any) {
      if (this.events[eventName]) {
        this.events[eventName](this.Event(eventName, data));
      }
    }
  
    private Event(type: string, data: any) {
      return { type, data };
    }
}