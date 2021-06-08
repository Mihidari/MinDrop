import React, { useRef } from 'react';

const Device = (props) => {
    const inputFile = useRef(null);

    const handleFiles = () => {
        inputFile.current.click();
    };

    return (
        <div className="device">
            <input type="file" ref={inputFile} id="selectedFile" multiple style={{ display: 'none' }}></input>
            <button className="display-device" onClick={handleFiles}></button>
            <div className="peer-name">{props.name}</div>
            <div className="peer-device">
                {props.os} {props.nav}
            </div>
        </div>
    );
};

export default Device;
