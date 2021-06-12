class Events {
    static fire(type, detail) {
        window.dispatchEvent(new CustomEvent(type, { detail: detail }));
    }

    static on(type, callback) {
        return window.addEventListener(type, callback, false);
    }

    static once(type, callback) {
        return window.addEventListener(type, callback, { once: true });
    }
}

export default Events;
