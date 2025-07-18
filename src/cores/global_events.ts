type EventHandler = (...args: any[]) => void;
type EventHandlerMap = {
  [eventName: string]: EventHandler[];
};

class GlobalEvent {
  private handlers: EventHandlerMap = {};
  private onceHandlers: EventHandlerMap = {};

  /**
   * Subscribe to an event
   * @param eventName Name of the event to subscribe to
   * @param handler Function to call when event is emitted
   */
  on(eventName: string, handler: EventHandler): void {
    if (!this.handlers[eventName]) {
      this.handlers[eventName] = [];
    }
    this.handlers[eventName].push(handler);
  }

  /**
   * Subscribe to an event that will only trigger once
   * @param eventName Name of the event to subscribe to
   * @param handler Function to call when event is emitted (only once)
   */
  once(eventName: string, handler: EventHandler): void {
    if (!this.onceHandlers[eventName]) {
      this.onceHandlers[eventName] = [];
    }
    this.onceHandlers[eventName].push(handler);
  }

  /**
   * Unsubscribe from an event
   * @param eventName Name of the event to unsubscribe from
   * @param handler Optional specific handler to remove. If not provided, all handlers for the event will be removed.
   */
  off(eventName: string, handler?: EventHandler): void {
    if (handler) {
      // Remove specific handler from regular handlers
      if (this.handlers[eventName]) {
        this.handlers[eventName] = this.handlers[eventName].filter(
          h => h !== handler
        );
      }
      // Remove specific handler from once handlers
      if (this.onceHandlers[eventName]) {
        this.onceHandlers[eventName] = this.onceHandlers[eventName].filter(
          h => h !== handler
        );
      }
    } else {
      // Remove all handlers for this event
      delete this.handlers[eventName];
      delete this.onceHandlers[eventName];
    }
  }

  /**
   * Emit an event
   * @param eventName Name of the event to emit
   * @param args Arguments to pass to event handlers
   */
  call(eventName: string, ...args: any[]): void {
    if (this.handlers[eventName]) {
      this.handlers[eventName].forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in event handler for ${eventName}:`, error);
        }
      });
    }

    if (this.onceHandlers[eventName]) {
      this.onceHandlers[eventName].forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in once event handler for ${eventName}:`, error);
        }
      });
      delete this.onceHandlers[eventName];
    }
  }

  /**
   * Clear all event listeners
   */
  clear(): void {
    this.handlers = {};
    this.onceHandlers = {};
  }
}

// Singleton instance for global use
const globalEvent = new GlobalEvent();

export default globalEvent;
