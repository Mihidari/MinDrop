const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

const style = canvas.style;
style.width = '100%';
style.position = 'absolute';
style.zIndex = '-1';
style.top = '0';
style.left = '0';

const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('Cannot initialize background animation');

let x0 = 0;
let y0 = 0;
let width = 0;
let height = 0;
let circleGap = 0;
let step = 0;
let loading = true;

const drawCircle = (radius: number) => {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.arc(x0, y0, radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.lineWidth = 2;
};

const drawCircles = () => {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < 8; i++) {
        drawCircle(circleGap * i + (step % circleGap));
    }
    step += 0.7;
};

const init = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    x0 = width / 2;
    y0 = height - 105;
    circleGap = Math.max(width, height, 1000) / 13;
    drawCircles();
};

const animate = () => {
    if (loading || step % circleGap < circleGap - 5) {
        requestAnimationFrame(() => {
            drawCircles();
            animate();
        });
    }
};

(window as unknown as Window & { animateBackground: (isLoading: boolean) => void }).animateBackground = (isLoading) => {
    loading = isLoading;
    animate();
};

window.onresize = init;

init();
animate();
