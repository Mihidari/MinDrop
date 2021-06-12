import React, { useEffect, useRef, useState } from 'react';
import Events from '../utils/event';

const Progress = (props) => {
    const circle = useRef(null);
    const [circumference, setCircumference] = useState(0);

    useEffect(() => {
        const radius = circle.current.r.baseVal.value;
        const cir = radius * 2 * Math.PI;
        setCircumference(cir);
        circle.current.style.strokeDasharray = `${cir} ${cir}`;
        circle.current.style.strokeDashoffset = cir;
        circle.current.style.stroke = 'rgba(39, 153, 171, 0.82)';
    }, []);

    useEffect(() => {
        const offset = circumference - (props.percent / 100) * circumference;
        if (offset === circumference) {
            circle.current.style.transition = 'none';
        } else {
            circle.current.style.transition = 'stroke-dashoffset 0.35s';
        }
        circle.current.style.strokeDashoffset = offset;
        circle.current.addEventListener(
            'transitionend',
            () => {
                Events.fire('transi');
            },
            { once: true }
        );
    }, [props.percent, circumference]);

    return (
        <div className="progress">
            <svg className="progress-ring" height="80" width="80">
                <circle
                    ref={circle}
                    strokeDashoffset="226.195"
                    strokeWidth="4"
                    className="progress-ring__circle"
                    fill="transparent"
                    r="36"
                    cx="40"
                    cy="40"
                />
            </svg>
        </div>
    );
};

export default Progress;
