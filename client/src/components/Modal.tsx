import React from 'react';

type ModalProps = {
    children: React.ReactNode;
    className?: string;
    onClose: () => void;
    open: boolean;
};

const Modal = ({ children, className = '', onClose, open }: ModalProps) => (
    <div className={`modal ${className} ${open ? 'open' : ''}`.trim()}>
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
