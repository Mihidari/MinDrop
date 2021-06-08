import React, { useEffect, useRef } from 'react';

const Device = (props) => {
    const inputFile = useRef(null);

    useEffect(() => {
        console.log(props);
    });

    const handleFiles = () => {
        inputFile.current.click();
    };

    return (
        <div className="device">
            <input type="file" ref={inputFile} id="selectedFile" multiple style={{ display: 'none' }}></input>
            <button className="display-device" onClick={handleFiles}></button>
            <div className="peer-name">Amber Alpaga</div>
            <div className="peer-device">Windows Chrome</div>
        </div>
    );
};

export default Device;
