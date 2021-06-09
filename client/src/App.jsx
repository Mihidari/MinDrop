import React, { useState, useEffect } from 'react';
import Device from './components/Device';
import './utils/network.js';
import Events from './utils/event.js';

function App() {
    const [name, setName] = useState('');
    const [id, setId] = useState('');
    const [peers, setPeers] = useState([]);

    const stockPeers = [];

    useEffect(() => {
        Events.on('join', (data) => {
            data = data.detail;
            if (data.infos.id === document.cookie.replace('userid=', '')) {
                setName(data.infos.name);
                setId(data.infos.id);
            } else {
                setPeers([...stockPeers, data.infos]);
                stockPeers.push(data.infos);
            }
        });

        Events.on('leave', (data) => {
            for (let i = 0; i < stockPeers.length; i++) {
                if (data.detail.infos.id === stockPeers[i].id) {
                    stockPeers.splice(i, 1);
                    setPeers([...stockPeers]);
                }
            }
        });

        return () => {
            window.removeEventListener('join');
            window.removeEventListener('leave');
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
                            <Device key={v.id} name={v.name} os={v.os} nav={v.nav} id={id} send={false}></Device>
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
