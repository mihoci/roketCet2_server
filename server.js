const WebSocket = require('ws');
const express = require('express')
const http = require('http')

const app = express()
const server = http.createServer(app)
const port = process.env.PORT

app.get('/', (req, res)=>{
  res.send(port)
})

server.listen(port || 5001)

wss = new WebSocket.Server({server: server})


const messages = []

wss.on('connection', (ws, req) => {

    ws.on('message', (message) => {
        messages.unshift(JSON.parse(message));
        console.log(messages)
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