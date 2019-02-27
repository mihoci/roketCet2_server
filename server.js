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
const users = []

wss.on('connection', (ws, req) => {   
      let username;
      ws.on('message', (message) => {
        const parsedMsg = JSON.parse(message)
        //check type of message
        if(parsedMsg.username){
          //check if user already exists
          if(users.includes(parsedMsg.username)){
            ws.send(JSON.stringify({err: 'user exists'}))
          }else{
             //set user
            users.push(parsedMsg.username)
            username = parsedMsg.username;
            //send users to all users
            sendToAllUsers(JSON.stringify({users: users}));
          }

        }else{
          //push message to redis
          redisClient.lpush('messages', message)
          sendToAllUsers(message)
        }

      })

      ws.on('close',() =>  {
          console.log('client disconnected')
          users.splice(users.indexOf(username), 1)
          console.log(users)
          sendToAllUsers(JSON.stringify({users: users}))

      })

      //send all messages to client
      redisClient.lrange('messages', 0, -1, (err, reply)=>{
        if(err){
          return err;
        }
        ws.send(JSON.stringify(reply));
      })
      ws.send(JSON.stringify({users: users}))
    console.log('client connected')
})

const sendToAllUsers = (message)=>{
  for(const client of wss.clients){
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}