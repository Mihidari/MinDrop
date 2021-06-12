/* eslint-disable no-restricted-globals */
let array = [];
self.addEventListener('message', (event) => {
    if (event.data === 'download') {
        self.postMessage(array);
        array = [];
    } else {
        array.push(event.data);
    }
});
