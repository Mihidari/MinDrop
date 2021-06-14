let trad = {
    en: {
        click: 'Left click to send files, right click to send message',
        mobile: 'Tap to send files, long tap to send message',
        open: 'Open Mindrop on other devices to send files or messages',
        network: 'You can be discovered on the network as',
        send: 'Send a message',
        sendTo: 'Send to',
        messageReceived: 'Message received',
        copy: 'Copy',
        fileReceived: 'File received',
        save: 'Save',
        transferring: 'Tranferring...',
        receiving: 'Receiving...',
    },
    fr: {
        click: 'Clic gauche pour envoyer un fichier, clic droit pour envoyer un message',
        mobile: 'Appuyez pour envoyer des fichiers, appuyez longuement pour envoyer un message',
        open: 'Ouvrez Mindrop sur un autre appareil pour envoyer des fichiers ou messages',
        network: 'Vous pouvez être identifié sur le réseau en tant que',
        send: 'Envoyer un message',
        sendTo: 'Envoyer à',
        messageReceived: 'Message reçu',
        copy: 'Copier',
        fileReceived: 'Fichier reçu',
        save: 'Enregistrer',
        transferring: 'En cours de transfert...',
        receiving: "Réception d'un fichier...",
    },
};

trad = new Proxy(trad, {
    get(target, prop, receiver) {
        if (prop in target) return Reflect.get(...arguments);
        return Reflect.get(target, 'en', receiver);
    },
    set() {
        throw new Error('you cannot modify the translation');
    },
});

export default trad;
