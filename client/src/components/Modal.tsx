import React from 'react';

type ModalProps = {
    children: React.ReactNode;
    onClose: () => void;
    open: boolean;
};

const Modal = ({ children, onClose, open }: ModalProps) => (
    <div className={`modal ${open ? 'open' : ''}`}>
        <div className="modal-content">
            <div className="close-right">
                <button className="close" onClick={onClose} type="button">
                    &times;
                </button>
            </div>
            {children}
        </div>
    </div>
);

export default Modal;
