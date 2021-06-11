import React, { useRef, useEffect, useState } from 'react';
import streamSaver from 'streamsaver';
import { WritableStream, ReadableStream } from 'web-streams-polyfill/ponyfill';
import Events from '../utils/event';

const worker = new Worker('../worker.js');

if (!window.WritableStream) {
    streamSaver.WritableStream = WritableStream;
}
if (!window.ReadableStream.prototype.pipeTo) {
    window.ReadableStream = ReadableStream;
}

const MAX_CHUNK = 64000;

const Device = (props) => {
    const inputFile = useRef(null);
    const displayButton = useRef(null);
    const inputmsg = useRef(null);
    const modal = useRef(null);
    const close = useRef(null);
    const closeReceive = useRef(null);
    const sendButton = useRef(null);
    const modalReceive = useRef(null);
    const inputReceive = useRef(null);

    const [message, setMessage] = useState('');
    const [messageReceived, setReceivedMessage] = useState('');
    const [peer, setPeer] = useState({});

    useEffect(() => {
        displayButton.current.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            modal.current.style.opacity = '1';
            modal.current.style.visibility = 'visible';
        });
        close.current.addEventListener('click', () => {
            modal.current.style.opacity = '0';
            modal.current.style.visibility = 'hidden';
        });
        inputmsg.current.addEventListener('keyup', (e) => {
            if (e.keyCode === 13) {
                sendButton.current.click();
            }
        });
        modal.current.addEventListener('transitionend', () => {
            inputmsg.current.focus();
        });
        closeReceive.current.addEventListener('click', () => {
            modalReceive.current.style.opacity = '0';
            modalReceive.current.style.visibility = 'hidden';
        });
    }, []);

    useEffect(() => {
        if (Object.keys(peer).length === 0 && props.peer) {
            setPeer(props.peer);
        }
    }, [props.peer, peer]);

    useEffect(() => {
        if (Object.keys(peer).length > 0) {
            peer.on('data', (data) => {
                let dataDecode = new TextDecoder().decode(data);

                try {
                    dataDecode = JSON.parse(dataDecode);
                } catch {}

                switch (dataDecode.type) {
                    case 'message':
                        setReceivedMessage(dataDecode.message);
                        modalReceive.current.style.opacity = '1';
                        modalReceive.current.style.visibility = 'visible';
                        break;
                    case 'file-done':
                        //Ouvrir la modal pour demander l'autorisation à l'utilisateur
                        worker.postMessage('download');
                        worker.addEventListener('message', (event) => {
                            const stream = event.data.stream();
                            const fileStream = streamSaver.createWriteStream(dataDecode.name);
                            stream.pipeTo(fileStream);
                        });
                        break;
                    case 'backtracking':
                        Events.fire('backtracking');
                        break;
                    default:
                        worker.postMessage(data);
                        peer.send(JSON.stringify({ type: 'backtracking' }));
                }
            });
        }
    }, [peer]);

    const handleFiles = () => {
        inputFile.current.click();
    };

    const copy = () => {
        inputReceive.current.select();
        inputReceive.current.setSelectionRange(0, 99999);
        document.execCommand('copy');
        modalReceive.current.style.opacity = '0';
        modalReceive.current.style.visibility = 'hidden';
    };

    const handleSend = () => {
        setMessage('');
        modal.current.style.opacity = '0';
        modal.current.style.visibility = 'hidden';
        console.log(props.peer);
        if (props.peer) props.peer.send(JSON.stringify({ type: 'message', message }));
    };

    const readFile = () => {
        const file = inputFile.current.files[0];
        const size = file.size;
        let progress = 0;
        const name = file.name;
        let prevProgress = 0;

        console.log(`[P2P] Sending ${name}...`);

        const send = async () => {
            const arrayBuffer = await file.arrayBuffer();
            for (let i = 0; i < arrayBuffer.byteLength; i += MAX_CHUNK) {
                peer.write(new Uint8Array(arrayBuffer.slice(i, i + MAX_CHUNK)));

                if (arrayBuffer.byteLength > i + MAX_CHUNK) progress = Math.floor(((i + MAX_CHUNK) / size) * 100);
                else progress = 100;

                if (progress !== prevProgress) {
                    console.log(progress + '%');
                    prevProgress = progress;
                }

                await new Promise((resolve) => {
                    Events.on('backtracking', resolve);
                });
            }
            peer.send(JSON.stringify({ type: 'file-done', name: name }));
        };

        send();
    };

    return (
        <>
            <div className="device">
                <div ref={modal} className="modal">
                    <div className="modal-content">
                        <div className="close-right">
                            <span ref={close} className="close">
                                &times;
                            </span>
                        </div>
                        <p className="sendmsg">Send a message</p>
                        <input
                            className="msgbox"
                            placeholder="message"
                            ref={inputmsg}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        ></input>
                        <div className="reverse">
                            <button className="send-button" ref={sendButton} onClick={handleSend}>
                                Send to {props.name}
                            </button>
                        </div>
                    </div>
                </div>
                <div ref={modalReceive} className="modal">
                    <div className="modal-content">
                        <div className="close-right">
                            <span ref={closeReceive} className="close">
                                &times;
                            </span>
                        </div>
                        <p className="sendmsg">Message received</p>
                        <input ref={inputReceive} className="msgContent" value={messageReceived} readOnly></input>
                        <div className="reverse">
                            <button className="send-button" onClick={copy}>
                                Copy
                            </button>
                        </div>
                    </div>
                </div>
                <input
                    type="file"
                    onChange={readFile}
                    ref={inputFile}
                    id="selectedFile"
                    style={{ display: 'none' }}
                ></input>
                <button ref={displayButton} className="display-device" onClick={(e) => handleFiles(e)}></button>
                <div className="peer-name">{props.name}</div>
                <div className="peer-device">
                    {props.os} {props.nav}
                </div>
            </div>
        </>
    );
};

export default Device;
