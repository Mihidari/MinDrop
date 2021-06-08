import React, { useRef, useEffect } from 'react';

const Device = (props) => {
    const inputFile = useRef(null);
    const displayButton = useRef(null);

    useEffect(() => {
        displayButton.current.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }, []);

    const handleFiles = () => {
        inputFile.current.click();
    };

    const readFile = async () => {};

    return (
        <div className="device">
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
    );
};

export default Device;
