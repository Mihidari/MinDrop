<img src="https://github.com/Mihidari/MinDrop/blob/main/client/public/android-chrome-192x192.png?raw=true"></img>
<h1><a href="https://mindrop.net">MinDrop</a></h1>
<p>A local file sharing PWA inspired by Apple AirDrop.</p>
<p>MinDrop is built with :</p>
<ul>
<li><img width="20px" src="https://cdn.worldvectorlogo.com/logos/webrtc.svg"/> WebRTC</li>
<li><img width="20px" src="https://cdn.worldvectorlogo.com/logos/react-2.svg"/> React</li>
<li><img width="20px" src="https://cdn.worldvectorlogo.com/logos/websocket.svg"/> Websocket</li>
<li><img width="20px" src="https://cdn.worldvectorlogo.com/logos/nodejs-icon.svg"/> NodeJS</li>
</ul>
<hr>

<p>This app does not collect any information on the files or messages which are transmitted between peers.</p>
<p><strong>Free to use : <a href="https://mindrop.net">https://mindrop.net</a></strong></p>

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
