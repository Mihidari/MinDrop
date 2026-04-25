import React, { useRef, useEffect, useState } from 'react';
import Events from '../utils/event';
import Progress from './Progress';
import trad from '../utils/traductor';

const MAX_CHUNK = 64000;
const ZIP_FILENAME = 'mindrop-files.zip';

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

    const [message, setMessage] = useState('');
    const [messageReceived, setReceivedMessage] = useState('');
    const [peer, setPeer] = useState({});
    const [receivedFiles, setReceivedFiles] = useState([]);
    const [progress, setProgress] = useState(0);
    const [transferring, setTransferring] = useState(false);
    const [receiving, setReceiving] = useState(false);

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
    }, []);

    useEffect(() => {
        if (Object.keys(peer).length === 0 && props.peer) {
            setPeer(props.peer);
        }
    }, [props.peer, peer]);

    useEffect(() => {
        if (Object.keys(peer).length > 0) {
            let chunkArray = [];
            let currentFileSize = 0;
            let currentFileName = '';
            let currentFileReceived = 0;
            let batchTotalSize = 0;
            let batchFileCount = 0;
            let receivedFileCount = 0;
            let receivedSize = 0;
            let receivedFileList = [];
            let progress = 0;
            let prevProgress = 0;

            const resetTransferState = () => {
                progress = 0;
                currentFileSize = 0;
                currentFileName = '';
                currentFileReceived = 0;
                batchTotalSize = 0;
                batchFileCount = 0;
                receivedFileCount = 0;
                receivedSize = 0;
                prevProgress = 0;
                setProgress(progress);
                setReceiving(false);
            };

            const handleData = (data) => {
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
                        const blob = new Blob(chunkArray);
                        const bURL = URL.createObjectURL(blob);
                        receivedFileList = [
                            ...receivedFileList,
                            {
                                name: dataDecode.name || currentFileName,
                                size: dataDecode.size ?? currentFileSize,
                                blob: blob,
                                url: bURL,
                            },
                        ];
                        setReceivedFiles(receivedFileList);
                        receivedFileCount += 1;
                        receivedSize += currentFileSize;
                        currentFileReceived = 0;
                        chunkArray = [];

                        if (batchFileCount === 0) {
                            resetTransferState();
                            requestAuth();
                        }
                        break;
                    case 'file-batch-done':
                        setReceivedFiles(receivedFileList);
                        resetTransferState();
                        requestAuth();
                        break;
                    case 'file-start':
                        chunkArray = [];
                        currentFileSize = dataDecode.size;
                        currentFileName = dataDecode.name || '';
                        currentFileReceived = 0;
                        batchFileCount = dataDecode.batchCount || 0;
                        batchTotalSize = dataDecode.batchTotalSize || currentFileSize;

                        if (!dataDecode.batchCount || dataDecode.batchIndex === 0) {
                            receivedFileList = [];
                            receivedFileCount = 0;
                            receivedSize = 0;
                            progress = 0;
                            prevProgress = 0;
                            setReceivedFiles([]);
                            setProgress(progress);
                        }
                        setReceiving(true);
                        break;
                    case 'backtracking':
                        Events.fire('backtracking');
                        break;
                    default: {
                        chunkArray.push(data);
                        currentFileReceived += data.byteLength || data.length || 0;

                        if (batchTotalSize > 0) {
                            progress = Math.floor(((receivedSize + currentFileReceived) / batchTotalSize) * 100);
                        } else if (currentFileSize > 0) {
                            progress = Math.floor((currentFileReceived / currentFileSize) * 100);
                        } else if (batchFileCount > 0) {
                            progress = Math.floor((receivedFileCount / batchFileCount) * 100);
                        } else {
                            progress = 100;
                        }

                        if (progress !== prevProgress) {
                            setProgress(Math.min(progress, 100));
                            prevProgress = progress;
                        }
                        peer.send(JSON.stringify({ type: 'backtracking' }));
                    }
                }
            };

            peer.on('data', handleData);

            return () => {
                peer.removeListener('data', handleData);
            };
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

    const readFile = async () => {
        if (inputFile.current.value === '') return;

        const files = Array.from(inputFile.current.files);
        const totalSize = files.reduce((size, file) => size + file.size, 0);
        let transferredSize = 0;
        let progress = 0;
        let prevProgress = 0;

        setTransferring(true);

        for (const [fileIndex, file] of files.entries()) {
            const size = file.size;
            const name = file.name;
            let fileProgressSize = 0;

            console.log(`[P2P] Sending ${name}...`);
            peer.send(
                JSON.stringify({
                    type: 'file-start',
                    name: name,
                    size: size,
                    batchCount: files.length,
                    batchIndex: fileIndex,
                    batchTotalSize: totalSize,
                })
            );

            const arrayBuffer = await file.arrayBuffer();
            for (let i = 0; i < arrayBuffer.byteLength; i += MAX_CHUNK) {
                const chunk = arrayBuffer.slice(i, i + MAX_CHUNK);
                peer.write(new Uint8Array(chunk));
                fileProgressSize += chunk.byteLength;

                if (totalSize > 0) {
                    progress = Math.floor(((transferredSize + fileProgressSize) / totalSize) * 100);
                } else {
                    progress = Math.floor(((fileIndex + 1) / files.length) * 100);
                }

                await new Promise((resolve) => {
                    Events.once('backtracking', resolve);
                });

                if (progress !== prevProgress) {
                    setProgress(progress);
                    prevProgress = progress;
                }
            }

            transferredSize += size;
            peer.send(JSON.stringify({ type: 'file-done', name: name, size: size }));
        }

        peer.send(JSON.stringify({ type: 'file-batch-done' }));
        inputFile.current.value = '';
        setTransferring(false);
        setProgress(100);
        Events.once('transi', () => {
            setProgress(0);
        });
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

    const revokeReceivedFiles = () => {
        receivedFiles.forEach((file) => URL.revokeObjectURL(file.url));
        setReceivedFiles([]);
    };

    const closeDownloadModal = () => {
        closeModal(modalDownload);
        revokeReceivedFiles();
    };

    const saveAllReceivedFiles = async () => {
        const zipBlob = await createZipBlob(receivedFiles);
        const zipUrl = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');

        link.href = zipUrl;
        link.download = ZIP_FILENAME;
        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(zipUrl), 0);
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
                        <p className="sendmsg">{trad[props.lang]['send']}</p>
                        <input
                            className="msgbox"
                            placeholder="message"
                            ref={inputmsg}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        ></input>
                        <div className="reverse">
                            <button className="send-button" ref={sendButton} onClick={handleSend}>
                                {trad[props.lang]['sendTo']} {props.name}
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
                        <p className="sendmsg">{trad[props.lang]['messageReceived']}</p>
                        <input ref={inputReceive} className="msgContent" value={messageReceived} readOnly></input>
                        <div className="reverse">
                            <button className="copy-button" onClick={copy}>
                                {trad[props.lang]['copy']}
                            </button>
                        </div>
                    </div>
                </div>
                <div ref={modalDownload} className="modal download-modal">
                    <div className="modal-content">
                        <div className="close-right">
                            <span className="close" onClick={closeDownloadModal}>
                                &times;
                            </span>
                        </div>
                        <p className="file-received">
                            {receivedFiles.length > 1 ? trad[props.lang]['filesReceived'] : trad[props.lang]['fileReceived']}
                        </p>
                        {receivedFiles.length > 1 && (
                            <div className="reverse download">
                                <button className="download-button" type="button" onClick={saveAllReceivedFiles}>
                                    {trad[props.lang]['saveAll']}
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
                                    <a href={file.url} download={file.name} className="download-button">
                                        {trad[props.lang]['save']}
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <input
                    type="file"
                    multiple
                    onChange={readFile}
                    ref={inputFile}
                    id="selectedFile"
                    style={{ display: 'none' }}
                ></input>
                <button ref={displayButton} className="display-device" onClick={handleFiles}>
                    <Progress percent={progress}></Progress>
                </button>
                <div className="peer-name">{props.name}</div>
                <div className="peer-device">
                    {transferring
                        ? trad[props.lang]['transferring']
                        : receiving
                        ? trad[props.lang]['receiving']
                        : `${props.os} ${props.nav}`}
                </div>
            </div>
        </>
    );
};

export default Device;
