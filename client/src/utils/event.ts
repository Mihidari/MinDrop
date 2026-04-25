class Events {
    static fire(type: string, detail?: unknown) {
        window.dispatchEvent(new CustomEvent(type, { detail }));
    }

    static on(type: string, callback: EventListener) {
        return window.addEventListener(type, callback, false);
    }

    static once(type: string, callback: EventListener) {
        return window.addEventListener(type, callback, { once: true });
    }
}

export default Events;
