import React, { useState, useEffect } from 'react';
import Device from './components/Device';
import ws from './utils/network.js';
import Events from './utils/event.js';
import { createPeer, addPeer } from './utils/peers';

function App() {
    const [name, setName] = useState('');
    const [id, setId] = useState('');
    const [peers, setPeers] = useState([]);
    const [initiatorPeers, setInitiatorsPeers] = useState({});

    const stockPeers = [];
    const stockInitiators = {};
    const stockLocals = {};
    const tmpId = document.cookie.replace('userid=', '');

    useEffect(() => {
        const handleJoin = (data) => {
            data = data.detail;
            if (data.infos.id === tmpId) {
                setName(data.infos.name);
                setId(data.infos.id);
            } else {
                let initPeer = createPeer(ws, data.infos.id, tmpId);
                stockInitiators[data.infos.id] = initPeer;
                setInitiatorsPeers(stockInitiators);
                stockPeers.push(data.infos);
                setPeers([...stockPeers]);
            }
        };

        const handleLeave = (data) => {
            for (let i = 0; i < stockPeers.length; i++) {
                if (data.detail.infos.id === stockPeers[i].id) {
                    stockPeers.splice(i, 1);
                    setPeers([...stockPeers]);
                }
            }
            if (stockInitiators[data.detail.infos.id]) {
                stockInitiators[data.detail.infos.id].destroy();
                delete stockInitiators[data.detail.infos.id];
                setInitiatorsPeers(stockInitiators);
            }
            if (stockLocals[data.detail.infos.id]) {
                stockLocals[data.detail.infos.id].destroy();
                delete stockLocals[data.detail.infos.id];
            }
        };

        const handleSignal = (data) => {
            let lp = addPeer(ws, data.detail.signal, data.detail.callerId);
            stockLocals[data.detail.callerId] = lp;
        };

        const handleReturnSignal = (data) => {
            let callerid = data.detail.userToSignal;
            console.log(callerid);
            if (stockInitiators[callerid]) {
                stockInitiators[callerid].signal(data.detail.signal);
            }
        };

        Events.on('join', handleJoin);
        Events.on('leave', handleLeave);
        Events.on('signal', handleSignal);
        Events.on('return signal', handleReturnSignal);

        return () => {
            window.removeEventListener('join', handleJoin);
            window.removeEventListener('leave', handleLeave);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="App">
            <div className="header">
                <svg className="info icon">
                    <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"></path>
                </svg>
            </div>
            {peers.length > 0 ? (
                <div className="display-send">
                    <div className="instruction-send">Left click to send files, right click to send message</div>
                    <div className="devices">
                        {peers.map((v) => (
                            <Device
                                key={v.id}
                                name={v.name}
                                os={v.os}
                                nav={v.nav}
                                id={id}
                                send={false}
                                peer={initiatorPeers[v.id]}
                            ></Device>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="display-info">
                    <div className="instruction">Open Mindrop on other devices to send files or messages</div>
                </div>
            )}
            <div className="footer">
                <div className="circle"></div>
                <div className="aka">
                    You can be discovered on the network as <div className="name">{name ? name : '.....'}</div>
                </div>
            </div>
        </div>
    );
}

export default App;
