// const rtcConfig = {
//     iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
//     adpSemantics: 'unified-plan',
// };

// const localConnection = new RTCPeerConnection(rtcConfig);
// const remoteConnection = new RTCPeerConnection(rtcConfig);

// // localConnection
// //     .createOffer()
// //     .then((offer) => {
// //         console.log(offer);
// //         return localConnection.setLocalDescription(offer);
// //     })
// //     .then(() =>
// //         remoteConnection
// //             .setRemoteDescription(new RTCSessionDescription())
// //             .then(() => {})
// //     );

const ws = new WebSocket('ws://localhost:3387');

ws.onmessage = (msg) => {
    console.log(msg);
};