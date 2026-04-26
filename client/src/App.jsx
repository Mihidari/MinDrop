import { useState, useEffect } from 'react';
import Device from './components/Device';
import ws from './utils/network';
import Events from './utils/event';
import { createPeer, addPeer } from './utils/peers';
import trad from './utils/traductor';

const lang = navigator.language.match(/^[a-zA-Z]{2}/)[0];

const getCookie = (key) =>
    document.cookie
        .split(';')
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith(`${key}=`))
        ?.slice(key.length + 1);

const App = () => {
    const [name, setName] = useState('');
    const [id, setId] = useState('');
    const [peers, setPeers] = useState([]);
    const [initiatorPeers, setInitiatorsPeers] = useState({});

    useEffect(() => {
        const stockPeers = new Map();
        const stockInitiators = {};
        let ownId = getCookie('userid');

        const syncPeers = () => setPeers(Array.from(stockPeers.values()));
        const syncInitiators = () => setInitiatorsPeers(Object.assign({}, stockInitiators));

        const setPeerInfo = (infos) => {
            stockPeers.set(infos.id, infos);
            syncPeers();
        };

        const removePeer = (peerId) => {
            if (stockInitiators[peerId]) {
                stockInitiators[peerId].destroy();
                delete stockInitiators[peerId];
                syncInitiators();
            }
            if (stockPeers.delete(peerId)) syncPeers();
        };

        const setPeerConnection = (peerId, peer) => {
            if (stockInitiators[peerId] && stockInitiators[peerId] !== peer) {
                stockInitiators[peerId].destroy();
            }
            stockInitiators[peerId] = peer;
            syncInitiators();
        };

        const handleJoin = (data) => {
            const tmpId = ownId || getCookie('userid');
            data = data.detail;
            if (data.infos.id === tmpId) {
                ownId = data.infos.id;
                setName(data.infos.name);
                setId(data.infos.id);
            } else {
                if (tmpId) {
                    const initPeer = createPeer(ws, data.infos.id, tmpId);
                    setPeerConnection(data.infos.id, initPeer);
                }
                setPeerInfo(data.infos);
            }
        };

        const handleLeave = (data) => {
            removePeer(data.detail.infos.id);
        };

        const handleSignal = (data) => {
            const lp = addPeer(ws, data.detail.signal, data.detail.callerId);
            setPeerConnection(data.detail.callerId, lp);
        };

        const handleReturnSignal = (data) => {
            let callerid = data.detail.userToSignal;
            if (stockInitiators[callerid]) {
                stockInitiators[callerid].signal(data.detail.signal);
            }
        };

        const handleList = (data) => {
            setPeerInfo(data.detail.infos);
        };

        Events.on('join', handleJoin);
        Events.on('leave', handleLeave);
        Events.on('signal', handleSignal);
        Events.on('return signal', handleReturnSignal);
        Events.on('list', handleList);

        return () => {
            window.removeEventListener('join', handleJoin);
            window.removeEventListener('leave', handleLeave);
            window.removeEventListener('signal', handleSignal);
            window.removeEventListener('return signal', handleReturnSignal);
            window.removeEventListener('list', handleList);
            Object.values(stockInitiators).forEach((peer) => peer.destroy());
        };
    }, []);

    return (
        <div className="App">
            <div className="header">
                <a href="https://github.com/Mihidari/MinDrop" rel="noreferrer" target="_blank">
                    <svg className="info icon">
                        <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"></path>
                    </svg>
                </a>
            </div>
            {peers.length > 0 ? (
                <div className="display-send">
                    <div className="instruction-send">{trad[lang]['click']}</div>
                    <div className="devices">
                        {peers.map((v) => (
                            <Device
                                key={v.id}
                                name={v.name}
                                os={v.os}
                                nav={v.nav}
                                id={id}
                                peer={initiatorPeers[v.id]}
                                lang={lang}
                            ></Device>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="display-info">
                    <div className="instruction">{trad[lang]['open']}</div>
                </div>
            )}
            <div className="footer">
                <div className={name ? 'circle-success' : 'circle-failure'}></div>
                <div className="aka">
                    {trad[lang]['network']} <div className="name">{name ? name : '.....'}</div>
                </div>
            </div>
        </div>
    );
};

export default App;
