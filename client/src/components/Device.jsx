import React, { useRef, useEffect, useState } from 'react';
import Events from '../utils/event';

const worker = new Worker('../worker.js');

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
    const modalDownload = useRef(null);
    const closeDownload = useRef(null);
    const downloadButton = useRef(null);

    const [message, setMessage] = useState('');
    const [messageReceived, setReceivedMessage] = useState('');
    const [peer, setPeer] = useState({});
    const [fileName, setFileName] = useState('');
    const [fileSize, setFileSize] = useState('');
    const [blobURL, setBlobURL] = useState('');

    useEffect(() => {
        displayButton.current.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            modal.current.style.opacity = '1';
            modal.current.style.visibility = 'visible';
        });
        inputmsg.current.addEventListener('keyup', (e) => {
            if (e.keyCode === 13) {
                sendButton.current.click();
            }
        });
        modal.current.addEventListener('transitionend', () => {
            inputmsg.current.focus();
        });
        close.current.addEventListener('click', () => closeModal(modal));
        closeReceive.current.addEventListener('click', () => closeModal(modalReceive));
        closeDownload.current.addEventListener('click', () => closeModal(modalDownload));
        downloadButton.current.addEventListener('click', () => closeModal(modalDownload));
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
                        worker.postMessage('download');
                        worker.addEventListener('message', (event) => {
                            setFileName(dataDecode.name);
                            setFileSize(dataDecode.size);
                            const blob = new Blob(event.data);
                            const blobURL = URL.createObjectURL(blob);
                            setBlobURL(blobURL);
                            requestAuth();
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

    const closeModal = (modalRef) => {
        modalRef.current.style.opacity = '0';
        modalRef.current.style.visibility = 'hidden';
    };

    const handleFiles = () => inputFile.current.click();

    const copy = () => {
        inputReceive.current.select();
        inputReceive.current.setSelectionRange(0, 99999);
        document.execCommand('copy');
        closeModal(modalReceive);
    };

    const handleSend = () => {
        setMessage('');
        closeModal(modal);
        if (props.peer) props.peer.send(JSON.stringify({ type: 'message', message }));
    };

    const readFile = () => {
        const file = inputFile.current.files[0];
        const size = file.size;
        let progress = 0;
        const name = file.name;
        let prevProgress = 0;

        console.log(`[P2P] Sending ${name}...`);

        (async () => {
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
            peer.send(JSON.stringify({ type: 'file-done', name: name, size: size }));
        })();
    };

    const requestAuth = () => {
        modalDownload.current.style.opacity = '1';
        modalDownload.current.style.visibility = 'visible';
    };

    const formatFileSize = (bytes) => {
        if (bytes >= 1e9) {
            return Math.round(bytes / 1e8) / 10 + ' GB';
        } else if (bytes >= 1e6) {
            return Math.round(bytes / 1e5) / 10 + ' MB';
        } else if (bytes > 1000) {
            return Math.round(bytes / 1000) + ' KB';
        } else {
            return bytes + ' Bytes';
        }
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
                            <button className="copy-button" onClick={copy}>
                                Copy
                            </button>
                        </div>
                    </div>
                </div>
                <div ref={modalDownload} className="modal">
                    <div className="modal-content">
                        <div className="close-right">
                            <span ref={closeDownload} className="close">
                                &times;
                            </span>
                        </div>
                        <p className="file-received">File received</p>
                        <p className="file-name">{fileName}</p>
                        <p className="file-size">{formatFileSize(fileSize)}</p>
                        <div className="reverse download">
                            <a href={blobURL} download={fileName} className="download-button" ref={downloadButton}>
                                Download
                            </a>
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
                <button ref={displayButton} className="display-device" onClick={handleFiles}></button>
                <div className="peer-name">{props.name}</div>
                <div className="peer-device">
                    {props.os} {props.nav}
                </div>
            </div>
        </>
    );
};

export default Device;
