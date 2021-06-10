import React, { useRef, useEffect, useState } from 'react';

const Device = (props) => {
    const inputFile = useRef(null);
    const displayButton = useRef(null);
    const inputmsg = useRef(null);
    const modal = useRef(null);
    const close = useRef(null);
    const sendButton = useRef(null);

    const [message, setMessage] = useState('');

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
    }, []);

    const handleFiles = () => {
        inputFile.current.click();
    };

    const handleSend = () => {
        modal.current.style.opacity = '0';
        modal.current.style.visibility = 'hidden';
        props.peer.send(message);
    };

    const readFile = async () => {};

    return (
        <>
            <div className="device">
                <div ref={modal} id="modal" className="modal">
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
                            onChange={(e) => setMessage(e.target.value)}
                        ></input>
                        <div className="reverse">
                            <button className="send-button" ref={sendButton} onClick={handleSend}>
                                Send to {props.name}
                            </button>
                        </div>
                    </div>
                </div>
                <input
                    type="file"
                    onChange={readFile}
                    ref={inputFile}
                    id="selectedFile"
                    multiple
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
