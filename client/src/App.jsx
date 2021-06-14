import React, { useState, useEffect } from 'react';
import Device from './components/Device';
import ws from './utils/network.js';
import Events from './utils/event.js';
import { createPeer, addPeer } from './utils/peers';
import trad from './utils/traductor';

const lang = navigator.language.match(/^[a-zA-Z]{2}/)[0];

const App = () => {
    const [name, setName] = useState('');
    const [id, setId] = useState('');
    const [peers, setPeers] = useState([]);
    const [initiatorPeers, setInitiatorsPeers] = useState({});

    useEffect(() => {
        const stockPeers = [];
        const stockInitiators = {};

        const handleJoin = (data) => {
            const tmpId = document.cookie.replace('userid=', '');
            data = data.detail;
            if (data.infos.id === tmpId) {
                setName(data.infos.name);
                setId(data.infos.id);
            } else {
                let initPeer = createPeer(ws, data.infos.id, tmpId);
                stockInitiators[data.infos.id] = initPeer;
                setInitiatorsPeers(Object.assign({}, stockInitiators));
                stockPeers.push(data.infos);
                setPeers([...stockPeers]);
            }
        };

        const handleLeave = (data) => {
            if (stockInitiators[data.detail.infos.id]) {
                stockInitiators[data.detail.infos.id].destroy();
                delete stockInitiators[data.detail.infos.id];
                setInitiatorsPeers(Object.assign({}, stockInitiators));
            }
            for (let i = 0; i < stockPeers.length; i++) {
                if (data.detail.infos.id === stockPeers[i].id) {
                    stockPeers.splice(i, 1);
                    setPeers([...stockPeers]);
                }
            }
        };

        const handleSignal = (data) => {
            let lp = addPeer(ws, data.detail.signal, data.detail.callerId);
            stockInitiators[data.detail.callerId] = lp;
            setInitiatorsPeers(Object.assign({}, stockInitiators));
        };

        const handleReturnSignal = (data) => {
            let callerid = data.detail.userToSignal;
            if (stockInitiators[callerid]) {
                stockInitiators[callerid].signal(data.detail.signal);
            }
        };

        const handleList = (data) => {
            stockPeers.push(data.detail.infos);
            setPeers([...stockPeers]);
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
