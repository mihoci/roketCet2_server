const NATS = require('nats');
const { Client } = require('pg')

let connectedUsers = []
const nats = NATS.connect();

const psqlClient =  new Client({
  user: 'pmihoci',
  host: 'localhost',
  database: 'roketCet2',
  port: 5432
})
psqlClient.connect()
console.log('db connected')


//check if user exists in database if not create it, respond with users id
nats.subscribe('getUser', async (request, replyTo) => {
  let res = await psqlClient.query('SELECT id, username as user FROM users WHERE username=$1', [request])
  
  if(res.rows.length !== 1){
    res = await psqlClient.query('INSERT INTO users VALUES(default, $1) RETURNING users.id, users.username AS user', [request])
  }
  
  nats.publish(replyTo, JSON.stringify(res.rows[0]))
})

//send all messages to user
nats.subscribe('getMessages', async (request, replyTo) => {
  let res = await psqlClient.query('SELECT users.username as user, messages.message FROM users RIGHT JOIN messages ON users.id=messages.uid ORDER BY messages.time_stamp ASC')
  console.log(res)
  nats.publish(replyTo, JSON.stringify(res.rows))
})

//save message to database
nats.subscribe('saveMessage', async (msg) => {
  msg = JSON.parse(msg)
  let res = await psqlClient.query('INSERT INTO messages VALUES($1, $2, current_timestamp)', [msg.message, msg.id])
  console.log(res)
})

//receive reports form users about connectiviy
nats.subscribe('userReport', (user) => {
  connectedUsers.push(user)
})



sendUsers = (users) => {
  nats.publish('connectedUsers', JSON.stringify(connectedUsers))
}

setInterval(()=>{
  sendUsers(connectedUsers)
  connectedUsers = []
  nats.publish('report', 'report')
}, 2000)

