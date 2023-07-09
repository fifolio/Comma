const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;
const cors = require('cors')
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URL);
const User = require('./models/User');
const Message = require('./models/Message')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const ws = require('ws');
const fs = require('fs');
// --------------------------------------- //

app.use('/uploads', express.static(__dirname + '/uploads'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())
app.use(cors({
    origin: 'https://comma.netlify.app',
    credentials: true,
}));


const bcryptSalt = bcrypt.genSaltSync(10)

async function getUserDataFromRequest(req) {
    return new Promise ((resolve, reject) => {
        const token = req.cookies?.token;
        if (token) {
            jwt.verify(token, jwtSecret, {}, (err, userData) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(userData)
                }
            });
        } else {
            reject('no token ')
        }
    })
}

app.get('/test', (req, res) => {
    res.json('Test ok')
})

app.get(`/messages/:userId`, async (req, res) => {
    try {
        const {userId} = req.params;
        const userData = await getUserDataFromRequest(req)
        const ourUserId = userData.userId;
        const messages = await Message.find({
            sender: {$in:[userId, ourUserId]},
            recipient: {$in: [userId, ourUserId]}
        }).sort({createdAt: 1});
        res.json(messages)
    } catch (error) {
        res.status(401).json('Unauthorized')
    }
})


app.get('/people', async(req, res) => {
    const users = await User.find({}, {'_id': 1, username: 1});
    res.json(users)
})

app.get('/profile', (req, res) => { 
    const token = req.cookies?.token;
    if(token) {
        jwt.verify(token, jwtSecret, {}, (err, userData ) => {
            if(err) throw err;
            res.json(userData)
        });
    } else {
        res.status(401).json('no token');
    }
})

app.post('/login', async (req, res) => {
    const {username, password} = req.body;
    const foundUser = await User.findOne({username});
    if (foundUser) {
        const passOk = bcrypt.compareSync(password, foundUser.password);
        if (passOk) {
            jwt.sign({userId: foundUser._id, username}, jwtSecret, {}, (err, token) => {
                res.cookie('token', token, {sameSite: 'none', secure: true}).json({
                    id: foundUser._id,
                })
            })
        }
    }

});

app.post('/logout', (req, res) => {
    res.cookie('token', '', {sameSite: 'none', secure:true}).json('ok');
})

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    
    try{
        const hashedPassword = bcrypt.hashSync(password, bcryptSalt)
        const createdUser = await User.create({ 
            username:username, 
            password:hashedPassword 
        });
        jwt.sign({ userId: createdUser._id, username }, jwtSecret, {}, (err, token) => {
            if(err){
                console.log('there an error')
            }
            res.cookie('token', token, {sameSite: 'none', secure: true}).status(201).json({
                id: createdUser._id
            });
            });
    } catch(err) {
        if(err) throw err;
        res.status(500).json('error');
    }
    
});

// --------------------------------------- //

const server = app.listen(process.env.PORT || 4000, () => {
    console.log('Server connected');
  });
  
  const wss = new ws.WebSocketServer({ server });
  

wss.on('connection', (connection, req) => {
    // console.log(`user is connected`, Date.now());

    function notifyAboutOnlinePeople() {
    // notify everyone about online users (when someone connects)
    [...wss.clients].forEach(client => {
        client.send(JSON.stringify(
            {
                online:[...wss.clients].map( connectedClient => ({
                    userId: connectedClient.userId,
                    username: connectedClient.username
                }))
            }
        ));
    });
    }

    connection.isAlive = true;
    connection.timer = setInterval(() => {
        connection.deathTimer = setTimeout(() => {
            connection.isAlive = false;
            clearInterval(connection.timer)
            connection.terminate();
            notifyAboutOnlinePeople();
        }, 1000)
    }, 5000);


    connection.on('pong', () => {
        clearTimeout(connection.deathTimer);
    });

    // read username and id from the cookie for this connection
    const cookies = req.headers.cookie;
    if(cookies){
        const  tokenCookieString = cookies.split(';').find(str => str.startsWith('token='));
        const token = tokenCookieString.split('=')[1]
        jwt.verify(token, jwtSecret, {}, async (err, userData) => {
            if(err){
                console.log('theres an err')
            } else if (!err) {
            const {userId, username} = userData;
            connection.userId = userId;
            connection.username = username;
            }
        });
    };

    connection.on('message', async (message) => {
        const messageData = JSON.parse(message.toString())
        const {recipient, text, file} = messageData;
        let filename = null;
        if(file) {
            const parts = file.name.split('.');
            const ext = parts[parts.length - 1]
            filename = Date.now() + '.'+ext;
            const path = __dirname + '/uploads/' + filename;
            const bufferData = new Buffer(file.data.split(',')[1], 'base64')
            fs.writeFile(path, bufferData, () => {
                console.log('file saved' + path)
            })
        }
        if (recipient && (text || file)){

            const messageDoc = await Message.create({
                sender: connection.userId,
                recipient,
                text,
                file: file ? filename : null
            });

            [...wss.clients]
            .filter(client => client.userId === recipient)
            .forEach(client => client.send(JSON.stringify({
                text, 
                sender: connection.userId,
                recipient,
                file: file ? filename : null,
                _id:messageDoc._id
            })))
        }
    });


    notifyAboutOnlinePeople();
});
