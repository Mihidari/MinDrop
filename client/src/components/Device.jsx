import React, { useCallback, useEffect, useRef, useState } from 'react';
import usePeerTransfer from '../hooks/usePeerTransfer';
import Modal from './Modal';
import Progress from './Progress';
import trad from '../utils/traductor';

const formatFileSize = (bytes) => {
    if (bytes >= 1e9) return Math.round(bytes / 1e8) / 10 + ' GB';
    if (bytes >= 1e6) return Math.round(bytes / 1e5) / 10 + ' MB';
    if (bytes > 1000) return Math.round(bytes / 1000) + ' KB';
    return bytes + ' Bytes';
};

const Device = ({ name, os, nav, peer, reconnectPeer, lang }) => {
    const inputFile = useRef(null);
    const messageInput = useRef(null);
    const receivedInput = useRef(null);
    const failedReadyVersion = useRef(null);

    const traductor = trad[lang];
    const [message, setMessage] = useState('');
    const [messageReceived, setReceivedMessage] = useState('');
    const [receivedFile, setReceivedFile] = useState(null);
    const [pendingFile, setPendingFile] = useState(null);
    const [sendingPendingFile, setSendingPendingFile] = useState(false);
    const [messageModalOpen, setMessageModalOpen] = useState(false);
    const [receiveModalOpen, setReceiveModalOpen] = useState(false);
    const [downloadModalOpen, setDownloadModalOpen] = useState(false);

    const handleMessageReceived = useCallback((nextMessage) => {
        setReceivedMessage(nextMessage);
        setReceiveModalOpen(true);
    }, []);

    const handleFileReceived = useCallback((file) => {
        setReceivedFile(file);
        setDownloadModalOpen(true);
    }, []);

    const { canSend, peerReady, peerReadyVersion, progress, receiving, transferring, sendFile, sendMessage } = usePeerTransfer(peer, {
        onMessage: handleMessageReceived,
        onFileReceived: handleFileReceived,
    });
    const peerStatus = transferring ? traductor['transferring'] : receiving ? traductor['receiving'] : !peerReady ? traductor['connecting'] : `${os} ${nav}`;

    useEffect(() => {
        if (messageModalOpen) messageInput.current?.focus();
    }, [messageModalOpen]);

    useEffect(() => {
        if (!pendingFile || !canSend || sendingPendingFile || failedReadyVersion.current === peerReadyVersion) return;

        const file = pendingFile;
        setSendingPendingFile(true);
        sendFile(file).then((sent) => {
            if (sent) {
                failedReadyVersion.current = null;
                setPendingFile(null);
            } else {
                failedReadyVersion.current = peerReadyVersion;
                reconnectPeer?.();
            }

            setSendingPendingFile(false);
        });
    }, [canSend, peerReadyVersion, pendingFile, reconnectPeer, sendFile, sendingPendingFile]);

    const handleFiles = () => {
        if (!canSend) return;
        inputFile.current.click();
    };

    const handleMessageModal = (e) => {
        e.preventDefault();
        if (!canSend) return;
        setMessageModalOpen(true);
    };

    const copy = async () => {
        await navigator.clipboard.writeText(messageReceived);
        setReceiveModalOpen(false);
    };

    const handleSend = () => {
        if (!message) return;
        try {
            sendMessage(message);
            setMessage('');
            setMessageModalOpen(false);
        } catch {}
    };

    const readFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        failedReadyVersion.current = null;
        setPendingFile(file);
        e.target.value = '';
    };

    const revoke = () => {
        setTimeout(() => {
            if (receivedFile?.blobURL) URL.revokeObjectURL(receivedFile.blobURL);
        }, 0);
        setDownloadModalOpen(false);
    };

    return (
        <div className="device">
            <Modal open={messageModalOpen} onClose={() => setMessageModalOpen(false)}>
                <p className="sendmsg">{traductor['send']}</p>
                <input
                    className="msgbox"
                    placeholder="message"
                    ref={messageInput}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyUp={(e) => e.key === 'Enter' && handleSend()}
                ></input>
                <div className="reverse">
                    <button className="send-button" onClick={handleSend} disabled={!peerReady}>
                        {traductor['sendTo']} {name}
                    </button>
                </div>
            </Modal>

            <Modal open={receiveModalOpen} onClose={() => setReceiveModalOpen(false)}>
                <p className="sendmsg">{traductor['messageReceived']}</p>
                <input ref={receivedInput} className="msgContent" value={messageReceived} readOnly></input>
                <div className="reverse">
                    <button className="copy-button" onClick={copy}>
                        {traductor['copy']}
                    </button>
                </div>
            </Modal>

            <Modal open={downloadModalOpen} onClose={revoke}>
                <p className="file-received">{traductor['fileReceived']}</p>
                <p className="file-name">{receivedFile?.name}</p>
                <p className="file-size">{receivedFile ? formatFileSize(receivedFile.size) : ''}</p>
                <div className="reverse download">
                    <a href={receivedFile?.blobURL} download={receivedFile?.name} onClick={revoke} className="download-button">
                        {traductor['save']}
                    </a>
                </div>
            </Modal>

            <input type="file" onChange={readFile} ref={inputFile} id="selectedFile" style={{ display: 'none' }}></input>
            <button className="display-device" onClick={handleFiles} onContextMenu={handleMessageModal} disabled={!canSend}>
                <Progress percent={progress}></Progress>
            </button>
            <div className="peer-name">{name}</div>
            <div className="peer-device">{peerStatus}</div>
        </div>
    );
};

export default Device;
