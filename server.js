const WebSocket = require('ws');
wss = new WebSocket.Server({port: 0987})

const messages = []

wss.on('connection', (ws, req) => {

    ws.on('message', (message) => {
        messages.push(JSON.parse(message));
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(message);
            }
          });
    })

    ws.on('close', () =>  {
        console.log('client disconnected')
    })

    
    ws.send(JSON.stringify(messages))
    console.log('client connected')
})