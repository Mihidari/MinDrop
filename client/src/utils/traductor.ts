type TranslationKey =
    | 'click'
    | 'open'
    | 'network'
    | 'send'
    | 'sendTo'
    | 'messageReceived'
    | 'copy'
    | 'fileReceived'
    | 'filesReceived'
    | 'save'
    | 'saveAll'
    | 'transferring'
    | 'receiving'
    | 'connecting';

type Translations = Record<TranslationKey, string>;

const translations: Record<string, Translations> = {
    en: {
        click: 'Left click to send one or more files, right click to send a message',
        open: 'Open Mindrop on other devices to send files or messages',
        network: 'You can be discovered on the network as',
        send: 'Send a message',
        sendTo: 'Send to',
        messageReceived: 'Message received',
        copy: 'Copy',
        fileReceived: 'File received',
        filesReceived: 'Files received',
        save: 'Save',
        saveAll: 'Save all',
        transferring: 'Tranferring...',
        receiving: 'Receiving...',
        connecting: 'Connecting...',
    },
    fr: {
        click: 'Clic gauche pour envoyer un ou plusieurs fichiers, clic droit pour envoyer un message',
        open: 'Ouvrez Mindrop sur un autre appareil pour envoyer des fichiers ou messages',
        network: 'Vous pouvez être identifié sur le réseau en tant que',
        send: 'Envoyer un message',
        sendTo: 'Envoyer à',
        messageReceived: 'Message reçu',
        copy: 'Copier',
        fileReceived: 'Fichier reçu',
        filesReceived: 'Fichiers reçus',
        save: 'Enregistrer',
        saveAll: 'Tout enregistrer',
        transferring: 'En cours de transfert...',
        receiving: "Réception d'un fichier...",
        connecting: 'Connexion...',
    },
};

const trad = new Proxy(translations, {
    get(target, prop: string) {
        return target[prop] ?? target.en;
    },
    set() {
        throw new Error('you cannot modify the translation');
    },
});

export default trad;
