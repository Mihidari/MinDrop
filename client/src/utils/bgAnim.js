let c = document.createElement('canvas');
document.body.appendChild(c);
let style = c.style;
style.width = '100%';
style.position = 'absolute';
style.zIndex = -1;
style.top = 0;
style.left = 0;
let ctx = c.getContext('2d');
let x0, y0, w, h, dw;

const init = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    c.width = w;
    c.height = h;
    x0 = w / 2;
    y0 = h - 105;
    dw = Math.max(w, h, 1000) / 13;
    drawCircles();
};
window.onresize = init;

const drawCircle = (radius) => {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.arc(x0, y0, radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.lineWidth = 2;
};

let step = 0;

const drawCircles = () => {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) {
        drawCircle(dw * i + (step % dw));
    }
    step += 0.7;
};

let loading = true;

const animate = () => {
    if (loading || step % dw < dw - 5) {
        requestAnimationFrame(function () {
            drawCircles();
            animate();
        });
    }
};

window.animateBackground = (l) => {
    loading = l;
    animate();
};

init();
animate();
