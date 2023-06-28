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
// --------------------------------------- //

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
}));

const bcryptSalt = bcrypt.genSaltSync(10)

async function getUserDataFromRequest(req) {
    return new Promise ((resolve, reject) => {
        const token = req.cookies?.token;
        if (token) {
            jwt.verify(token, jwtSecret, {}, (err, userData) => {
                if (err) throw err;
                resolve(userData)
            })
        } else {
            reject('no token ')
        }
    })
}

app.get('/test', (req, res) => {
    res.json('Test ok')
})

app.get(`/messages/:userId`, async (req, res) => {
    const {userId} = req.params;
    const userData = await getUserDataFromRequest(req)
    const ourUserId = userData.userId;
    const messages = await Message.find({
        sender: {$in:[userId, ourUserId]},
        recipient: {$in: [userId, ourUserId]}
    }).sort({createdAt: 1});
    res.json(messages)
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

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    
    try{
        const hashedPassword = bcrypt.hashSync(password, bcryptSalt)
        const createdUser = await User.create({ 
            username:username, 
            password:hashedPassword 
        });
        jwt.sign({ userId: createdUser._id, username }, jwtSecret, {}, (err, token) => {
            if (err) throw err;
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

const server = app.listen(4000, () => {
    console.log('Server started on port 4000')
})

const wss = new ws.WebSocketServer({server});

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
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
            if(err) throw err;
            const {userId, username} = userData;
            connection.userId = userId;
            connection.username = username;
        });
    };

    connection.on('message', async (message) => {
        const messageData = JSON.parse(message.toString())
        const {recipient, text} = messageData;
        if (recipient && text){

            const messageDoc = await Message.create({
                sender: connection.userId,
                recipient,
                text,
            });

            [...wss.clients]
            .filter(client => client.userId === recipient)
            .forEach(client => client.send(JSON.stringify({
                text, 
                sender: connection.userId,
                recipient,
                _id:messageDoc._id
            })))
        }
    });


    notifyAboutOnlinePeople();
});
