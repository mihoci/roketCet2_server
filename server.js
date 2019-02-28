const WebSocket = require('ws');
const express = require('express')
const http = require('http')
const { Client } = require('pg')

const app = express()
const server = http.createServer(app)
const port = process.env.PORT

app.get('/', (req, res)=>{
  res.send(port)
})

server.listen(port || 5001)
wss = new WebSocket.Server({server: server})

let users = []

wss.on('connection', async (ws, req) => {
    let uid=false
    let username;

    try{
      //connect to db
      const psqlClient =  new Client({
        user: 'pmihoci',
        host: 'localhost',
        database: 'roketCet2',
        port: 5432
      })
      psqlClient.connect()
      console.log('client connected')

      //get messages from db and send them
      let res = await psqlClient.query('SELECT users.username as user, messages.message FROM users RIGHT JOIN messages ON users.id=messages.uid ORDER BY messages.time_stamp DESC')
      ws.send(JSON.stringify(res.rows))

      ws.on('message', async (data) => {
          const msg = JSON.parse(data)

          try{
            //check type of message
            if(msg.setUser){
              res = await psqlClient.query('SELECT * FROM users WHERE username=$1', [msg.setUser])

              //if user does not exist create it
              if(res.rows.length === 1){
                uid = res.rows[0].id
              }else{
                res = await psqlClient.query('INSERT INTO users VALUES(default, $1) RETURNING users.id', [msg.setUser])
                uid = res.rows[0].id
              }
              
              //push user to array and send it to everyone
              username = msg.setUser
              users.push(msg.setUser)
              sendToAllUsers(JSON.stringify(users))
              console.log(users)

            }else{
              //add message to db and send it to everyone connected
              res = await psqlClient.query('INSERT INTO messages VALUES($1, $2, current_timestamp)', [msg.message, uid])
              sendToAllUsers(data)
            }

          }catch(e){
            console.log(e)
          }
          
      })


      ws.on('close', () =>  {
          console.log('client disconnected')
          //remove user from array and send the array to everyone
          users.splice(users.indexOf(username), 1)
          sendToAllUsers(JSON.stringify(users))
          console.log(users)
          username = undefined
          psqlClient.end()
      })
      
    }catch(e){
      console.log(e)
    }
})


const sendToAllUsers = (message) => {
  for(const client of wss.clients){
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}