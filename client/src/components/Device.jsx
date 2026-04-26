import React, { useCallback, useEffect, useRef, useState } from 'react';
import usePeerTransfer from '../hooks/usePeerTransfer';
import AnimalSilhouette from './AnimalSilhouette';
import Modal from './Modal';
import Progress from './Progress';
import trad from '../utils/traductor';

const getZipFilename = () => {
    const id = globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 5)
        : Math.random().toString(36).slice(2, 7);

    return `mindrop-${id}.zip`;
};

const crcTable = (() => {
    const table = [];

    for (let i = 0; i < 256; i += 1) {
        let crc = i;

        for (let j = 0; j < 8; j += 1) {
            crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
        }

        table[i] = crc >>> 0;
    }

    return table;
})();

const crc32 = (bytes) => {
    let crc = 0xffffffff;

    for (let i = 0; i < bytes.length; i += 1) {
        crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }

    return (crc ^ 0xffffffff) >>> 0;
};

const createZipBlob = async (files) => {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    const date = new Date();
    const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
    const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
    let offset = 0;

    const header = (size) => {
        const buffer = new ArrayBuffer(size);
        const view = new DataView(buffer);
        let position = 0;

        return {
            bytes: new Uint8Array(buffer),
            uint16(value) {
                view.setUint16(position, value, true);
                position += 2;
            },
            uint32(value) {
                view.setUint32(position, value, true);
                position += 4;
            },
        };
    };

    for (const [index, file] of files.entries()) {
        const bytes = new Uint8Array(await file.blob.arrayBuffer());
        const fileName = files.length > 1 ? `${index + 1}-${file.name}` : file.name;
        const fileNameBytes = encoder.encode(fileName);
        const checksum = crc32(bytes);
        const localOffset = offset;

        const localHeader = header(30);
        localHeader.uint32(0x04034b50);
        localHeader.uint16(20);
        localHeader.uint16(0x0800);
        localHeader.uint16(0);
        localHeader.uint16(dosTime);
        localHeader.uint16(dosDate);
        localHeader.uint32(checksum);
        localHeader.uint32(bytes.length);
        localHeader.uint32(bytes.length);
        localHeader.uint16(fileNameBytes.length);
        localHeader.uint16(0);
        localParts.push(localHeader.bytes, fileNameBytes, bytes);
        offset += localHeader.bytes.length + fileNameBytes.length + bytes.length;

        const centralHeader = header(46);
        centralHeader.uint32(0x02014b50);
        centralHeader.uint16(20);
        centralHeader.uint16(20);
        centralHeader.uint16(0x0800);
        centralHeader.uint16(0);
        centralHeader.uint16(dosTime);
        centralHeader.uint16(dosDate);
        centralHeader.uint32(checksum);
        centralHeader.uint32(bytes.length);
        centralHeader.uint32(bytes.length);
        centralHeader.uint16(fileNameBytes.length);
        centralHeader.uint16(0);
        centralHeader.uint16(0);
        centralHeader.uint16(0);
        centralHeader.uint16(0);
        centralHeader.uint32(0);
        centralHeader.uint32(localOffset);
        centralParts.push(centralHeader.bytes, fileNameBytes);
    }

    const centralDirectorySize = centralParts.reduce((size, part) => size + part.length, 0);
    const endHeader = header(22);
    endHeader.uint32(0x06054b50);
    endHeader.uint16(0);
    endHeader.uint16(0);
    endHeader.uint16(files.length);
    endHeader.uint16(files.length);
    endHeader.uint32(centralDirectorySize);
    endHeader.uint32(offset);
    endHeader.uint16(0);

    return new Blob([...localParts, ...centralParts, endHeader.bytes], { type: 'application/zip' });
};

const formatFileSize = (bytes) => {
    if (bytes >= 1e9) return Math.round(bytes / 1e8) / 10 + ' GB';
    if (bytes >= 1e6) return Math.round(bytes / 1e5) / 10 + ' MB';
    if (bytes > 1000) return Math.round(bytes / 1000) + ' KB';
    return bytes + ' Bytes';
};

const Device = ({ name, os, nav, peer, reconnectPeer, lang }) => {
    const inputFile = useRef(null);
    const longPressTimer = useRef(null);
    const suppressNextClick = useRef(false);
    const messageInput = useRef(null);
    const receivedInput = useRef(null);
    const failedReadyVersion = useRef(null);

    const traductor = trad[lang];
    const [message, setMessage] = useState('');
    const [messageReceived, setReceivedMessage] = useState('');
    const [receivedFiles, setReceivedFiles] = useState([]);
    const [pendingFiles, setPendingFiles] = useState([]);
    const [sendingPendingFiles, setSendingPendingFiles] = useState(false);
    const [messageModalOpen, setMessageModalOpen] = useState(false);
    const [receiveModalOpen, setReceiveModalOpen] = useState(false);
    const [downloadModalOpen, setDownloadModalOpen] = useState(false);

    const handleMessageReceived = useCallback((nextMessage) => {
        setReceivedMessage(nextMessage);
        setReceiveModalOpen(true);
    }, []);

    const handleFilesReceived = useCallback((files) => {
        setReceivedFiles(files);
        setDownloadModalOpen(true);
    }, []);

    const { canSend, peerReady, peerReadyVersion, progress, receiving, transferring, sendFiles, sendMessage } = usePeerTransfer(peer, {
        onMessage: handleMessageReceived,
        onFilesReceived: handleFilesReceived,
    });
    const peerStatus = transferring ? traductor['transferring'] : receiving ? traductor['receiving'] : !peerReady ? traductor['connecting'] : `${os} ${nav}`;

    useEffect(() => {
        if (messageModalOpen) messageInput.current?.focus();
    }, [messageModalOpen]);

    useEffect(() => () => clearTimeout(longPressTimer.current), []);

    useEffect(() => {
        if (pendingFiles.length === 0 || !canSend || sendingPendingFiles || failedReadyVersion.current === peerReadyVersion) return;

        const files = pendingFiles;
        setSendingPendingFiles(true);
        sendFiles(files).then((sent) => {
            if (sent) {
                failedReadyVersion.current = null;
                setPendingFiles([]);
            } else {
                failedReadyVersion.current = peerReadyVersion;
                reconnectPeer?.();
            }

            setSendingPendingFiles(false);
        });
    }, [canSend, peerReadyVersion, pendingFiles, reconnectPeer, sendFiles, sendingPendingFiles]);

    const openMessageModal = () => {
        if (!canSend) return;
        setMessageModalOpen(true);
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        openMessageModal();
    };

    const handleTouchStart = () => {
        if (!canSend) return;
        longPressTimer.current = setTimeout(() => {
            suppressNextClick.current = true;
            openMessageModal();
        }, 500);
    };

    const clearLongPress = () => clearTimeout(longPressTimer.current);

    const handleFiles = (e) => {
        if (suppressNextClick.current) {
            e?.preventDefault();
            suppressNextClick.current = false;
            return;
        }
        if (!canSend) return;
        inputFile.current.click();
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
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        failedReadyVersion.current = null;
        setPendingFiles(files);
        e.target.value = '';
    };

    const revokeReceivedFiles = () => {
        receivedFiles.forEach((file) => URL.revokeObjectURL(file.blobURL));
        setReceivedFiles([]);
    };

    const closeDownloadModal = () => {
        setDownloadModalOpen(false);
        revokeReceivedFiles();
    };

    const saveAllReceivedFiles = async () => {
        const zipBlob = await createZipBlob(receivedFiles);
        const zipUrl = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');

        link.href = zipUrl;
        link.download = getZipFilename();
        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(zipUrl), 0);
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

            <Modal open={downloadModalOpen} onClose={closeDownloadModal} className="download-modal">
                <p className="file-received">{receivedFiles.length > 1 ? traductor['filesReceived'] : traductor['fileReceived']}</p>
                {receivedFiles.length > 1 && (
                    <div className="reverse download">
                        <button className="download-button" type="button" onClick={saveAllReceivedFiles}>
                            {traductor['saveAll']}
                        </button>
                    </div>
                )}
                <div className="received-files">
                    {receivedFiles.map((file, index) => (
                        <div className="received-file" key={`${file.name}-${index}`}>
                            <div className="received-file-info">
                                <p className="file-name">{file.name}</p>
                                <p className="file-size">{formatFileSize(file.size)}</p>
                            </div>
                            <a href={file.blobURL} download={file.name} className="download-button">
                                {traductor['save']}
                            </a>
                        </div>
                    ))}
                </div>
            </Modal>

            <input type="file" multiple onChange={readFile} ref={inputFile} id="selectedFile" style={{ display: 'none' }}></input>
            <button
                className="display-device"
                onClick={handleFiles}
                onContextMenu={handleContextMenu}
                onTouchStart={handleTouchStart}
                onTouchEnd={clearLongPress}
                onTouchCancel={clearLongPress}
                onTouchMove={clearLongPress}
                disabled={!canSend}
            >
                <AnimalSilhouette name={name} />
                <Progress percent={progress}></Progress>
            </button>
            <div className="peer-name">{name}</div>
            <div className="peer-device">{peerStatus}</div>
        </div>
    );
};

export default Device;
