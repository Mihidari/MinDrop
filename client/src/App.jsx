import React, { useState, useEffect } from 'react';
import Device from './components/Device';

function App() {
    const [name, setName] = useState('');
    const [peers, setPeers] = useState([]);

    const stockPeers = [];

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:3387');

        ws.onmessage = (msg) => {
            let data = JSON.parse(msg.data);
            console.log(data);
            if (data.type === 'join' && data.infos.id === document.cookie.replace('userid=', '')) {
                setName(data.infos.name);
            } else if (data.type === 'join') {
                setPeers([...stockPeers, data.infos]);
                stockPeers.push(data.infos);
            }

            if (data.type === 'leave') {
                for (let i = 0; i < stockPeers.length; i++) {
                    if (data.infos.id === stockPeers[i].id) {
                        stockPeers.splice(i, 1);
                        setPeers([...stockPeers]);
                    }
                }
            }
        };

        return () => ws.close();
    }, []);

    return (
        <div className="App">
            <div className="header">
                {/* <svg className="homescreen icon">
                    <path d="M18 1.01L8 1c-1.1 0-2 .9-2 2v3h2V5h10v14H8v-1H6v3c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM10 15h2V8H5v2h3.59L3 15.59 4.41 17 10 11.41z" />
                </svg>
                <svg className="notif icon">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                </svg> */}
                <svg className="info icon">
                    <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"></path>
                </svg>
            </div>
            {peers.length > 0 ? (
                <div className="display-send">
                    <div className="instruction-send">Left click to send files, right click to send message</div>
                    <div className="devices">
                        {peers.map((v) => (
                            <Device key={v.id} name={v.name} os={v.os} nav={v.nav}></Device>
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
