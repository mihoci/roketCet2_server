const WebSocket = require('ws');
const express = require('express')
const http = require('http')
const redis = require('redis')

const app = express()
const server = http.createServer(app)
const port = process.env.PORT

let redisClient = redis.createClient();
redisClient.on('connect',()=>{
  console.log('connected to redis')
})

app.get('/', (req, res)=>{
  res.send(port)
})

server.listen(port || 5001)
wss = new WebSocket.Server({server: server})

wss.on('connection', (ws, req) => {   
      ws.on('message', (message) => {
        redisClient.lpush('messages', message)
        for(const client of wss.clients){
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        }
      })

      ws.on('close',() =>  {
          console.log('client disconnected')
      })

      //send all messages to client
      redisClient.lrange('messages', 0, -1, (err, reply)=>{
        if(err){
          return err;
        }
        console.log(reply)
        ws.send(JSON.stringify(reply));
      })
    console.log('client connected')
})