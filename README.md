<img src="https://github.com/Mihidari/MinDrop/blob/main/client/public/android-chrome-192x192.png?raw=true"></img>
<h1><a href="https://mindrop.net">MinDrop</a></h1>
<p>A free, private local file sharing PWA inspired by Apple AirDrop.</p>

MinDrop helps you send files and messages directly between nearby phones, tablets, and computers from a browser. It is useful as an AirDrop alternative for Android, Windows, iOS, macOS, and Linux devices on the same local network.

<p>MinDrop is built with :</p>
<ul>
<li><img width="20px" src="https://cdn.worldvectorlogo.com/logos/webrtc.svg"/> WebRTC</li>
<li><img width="20px" src="https://cdn.worldvectorlogo.com/logos/react-2.svg"/> React</li>
<li><img width="20px" src="https://cdn.worldvectorlogo.com/logos/websocket.svg"/> Websocket</li>
<li><img width="20px" src="https://cdn.worldvectorlogo.com/logos/nodejs-icon.svg"/> NodeJS</li>
</ul>
<hr>

<p>This app does not collect any information on the files or messages which are transmitted between peers.</p>
<p>File and message content is transferred peer-to-peer with WebRTC. The server is used for device discovery and connection signaling.</p>
<p><strong>Free to use : <a href="https://mindrop.net">https://mindrop.net</a></strong></p>

## Features

- Send files between nearby devices from a web browser.
- Send short messages between devices.
- Works as a Progressive Web App.
- No account required.
- No cloud upload for file or message content.
- Open source and free to use.

## Common Use Cases

- Send files from Android to Windows.
- Send files from phone to computer.
- Share files locally without email, USB cables, or cloud storage.
- Use a browser-based AirDrop alternative across different operating systems.

## Development

Requirements:

- Node.js 22 or newer
- Corepack enabled for Yarn

Install dependencies:

```sh
corepack yarn install
```

Run the WebSocket server and Vite client together:

```sh
corepack yarn dev
```

The client runs at `http://localhost:5173` and connects to the WebSocket server at `ws://localhost:3387`.

For Android/mobile file transfer testing, use the production-like preview command instead of `yarn dev`:

```sh
corepack yarn mobile
```

This builds the app, starts the WebSocket server, and serves the client with `vite preview` on the local network. It avoids the Vite development client, which can reload the page when Android backgrounds Chrome for the file picker. Use the printed network URL, usually `http://<your-lan-ip>:4173`.

Build both packages:

```sh
corepack yarn build
```
