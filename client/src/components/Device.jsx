import React, { useRef, useEffect, useState } from 'react';
import streamSaver from 'streamsaver';
import { WritableStream, ReadableStream } from 'web-streams-polyfill/ponyfill';

const worker = new Worker('../worker.js');

if (!window.WritableStream) {
    streamSaver.WritableStream = WritableStream;
}
if (!window.ReadableStream.prototype.pipeTo) {
    window.ReadableStream = ReadableStream;
}

console.log(window.ReadableStream);

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

                if (dataDecode.type === 'message') {
                    setReceivedMessage(dataDecode.message);
                    modalReceive.current.style.opacity = '1';
                    modalReceive.current.style.visibility = 'visible';
                } else if (dataDecode.type === 'file-done') {
                    //Ouvrir la modal pour demander l'autorisation à l'utilisateur
                    worker.postMessage('download');
                    worker.addEventListener('message', (event) => {
                        const stream = event.data.stream();
                        console.log(stream);
                        const fileStream = streamSaver.createWriteStream(dataDecode.name);
                        stream.pipeTo(fileStream);
                    });
                } else {
                    worker.postMessage(data);
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
        let totalSent = 0;
        let progress = 0;
        const stream = file.stream();
        const reader = stream.getReader();
        const name = file.name;

        reader.read().then((v) => {
            handleReading(v.done, v.value);
        });

        const handleReading = async (done, value) => {
            if (value) {
                totalSent += value.length;
                progress = totalSent / size;
                console.log(Math.floor(progress * 100) + '%');
            }

            if (done) {
                peer.write(JSON.stringify({ type: 'file-done', name: name }));
                return;
            }

            await peer.write(value);

            reader.read().then((v) => {
                handleReading(v.done, v.value);
            });
        };
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
