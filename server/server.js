import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import express from 'express'
import cors from 'cors'
import { getUser, makeUser, getCommittees, createCommittee, getCommitteeByKey, getCommitteeMembers, joinCommittee } from './database.js';
import { saveChatMessage, getChatMessages } from './database.js';
import { getMotion, getMotions, makeMotion } from './database.js';
import { upload }  from './multerSetup.js'

import bodyParser from 'body-parser';
import token from 'jsonwebtoken'
import { Server } from "socket.io";

import { createServer } from "node:http";

  
import {handleChatConnection} from "./chatController.js"; 
import {setIoInstance} from './chatController.js';





const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({extended: true}));

//add server and io for socket
const server = createServer(app);
const io = new Server(server)

const port = 8080;

// Login + Registration

/**
 * Registration
 * Get password and username from frontend
 * encrypt password with bcrypt
 * store in database
 */

app.use(cors({origin: "http://127.0.0.1:5500"}));

//set io instance
setIoInstance(io);

// Chat connection handling
io.on("connection", (socket) => {
    socket.on('joinRoom', async (motionKey) => {
        socket.join(motionKey);
        const messages = await getChatMessages(motionKey);
        socket.emit('messageHistory', messages);
    });

    socket.on('chatMessage', async ({ motionKey, sender, message }) => {
        await saveChatMessage(motionKey, sender, message);
        io.to(motionKey).emit('message', { sender, message });
    });

    handleChatConnection(socket);
});

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, 'client')));

// THIS IS WHERE YOU GO @ LOCALHOST:8080
app.get('/', (req, res) => {
    //res.sendFile(path.join(__dirname, "../client/committee_related/committee_template.html"));
});


/**
 * When creating new user:
 * hash password
 * create new user object (javascript object)
 * upload pfp to server
 * add to database in order: username, password, user object
 */

/*
app.post("/api/register", async (req, res) => {
    const {username, password,fname, lname, email} = req.body;

    console.log(fname, lname);
    let currentDate = new Date();

    let date = ("0" + currentDate.getDate()).slice(-2);

    // get current month
    let month = ("0" + (currentDate.getMonth() + 1)).slice(-2);

    // get current year
    let year = currentDate.getFullYear();

    let fullDate = year + "-" + month + "-" + date;

    makeUser(username,password,fname,lname,email,fullDate);

    res.status(200).send("Registration Success");

});
*/

app.post("/api/register", async (req, res) => {
    console.log("reached api");
    upload (req, res, async (err) => {
        console.log("reached upload");
        if (err) {
            return res.status(400).send({ message: "File upload error", error: err.message });
        }

        const {username, password,fname, lname, email} = req.body;

        if (!req.file) {
            return res.status(400).send({ message: "Profile image is required" });
        }

        const profileImagePath = req.file.path; // Path to the uploaded profile image
        console.log("Profile image uploaded to:", profileImagePath);

        console.log(fname, lname);
        let currentDate = new Date();
    
        let date = ("0" + currentDate.getDate()).slice(-2);
    
        // get current month
        let month = ("0" + (currentDate.getMonth() + 1)).slice(-2);
    
        // get current year
        let year = currentDate.getFullYear();
    
        let fullDate = year + "-" + month + "-" + date;
        try {
    
        makeUser(username,password,fname,lname,email,fullDate, profileImagePath);
    
        res.status(200).send("Registration Success");
        }
        catch (err) {
            console.log("Could not create user:", err);
            res.status(401).send("Could not create user");
        }

    });
});

// Server should store current user 
let currentUser;

// User authentication
app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    console.log(username, password);
    console.log("login api");
    const result = await getUser(username, password);
    // const result = getUser(username, password);

    if (!result) {
        res.status(401).send("User not found or password incorrect");
    }
    else {
        const userInfo = { // store user data in session storage on client side
            key: result.userKey,
            username: result.username,
            password: result.password,
            fname: result.firstName,
            lname: result.lastName,
            email: result.email,
            pfp: result.pfpPath
        }

        currentUser = userInfo;
        // redirect to home page
        res.status(200).send({
            userData: userInfo
        });
    }
    

});


// Update user
app.put("/api/dashboard/profile/update", (req, res) => {

});

// Delete user

// Get committees associated with user
app.post("/api/dashboard/committee", async (req, res) => {
    const { currentKey } = req.body;
    const committeesResponse = await getCommittees(currentKey);

    if (!committeesResponse) {
        res.status(404).send("You are not in any committees");
    }
    else {
        res.status(200).send({
            userCommittees: committeesResponse
        });
    }
});

// Get specific committee
app.get("/api/committee/:committeeKey", async (req,res) => {
    const committeeKey = req.params.committeeKey;

    console.log("server received", committeeKey);

    const committeeFound = await getCommitteeByKey(committeeKey);

    if (!committeeFound) {
        res.status(404).send("Committee not found");
    }
    else {
        res.status(200).send({
            committeeAtKey: committeeFound
        });
    }

});

app.get("/api/committee/:committeeKey/users", async (req, res) => {
    const committeeKey = req.params.committeeKey;

    const committeeFound = await getCommitteeMembers(committeeKey);

    if (!committeeFound) {
        res.status(404).send("Committee not found");
    }
    else {
        res.status(200).send({
            committeeMembers: committeeFound
        });
    }
});


// Create committee
app.post("/api/committee/create", async (req, res) => {
    const {cname, cpassword,currentUserKey} = req.body;

    let currentDate = new Date();

    let date = ("0" + currentDate.getDate()).slice(-2);

    // get current month
    let month = ("0" + (currentDate.getMonth() + 1)).slice(-2);

    // get current year
    let year = currentDate.getFullYear();

    let fullDate = year + "-" + month + "-" + date;

    const committeeMade = await createCommittee(cname, cpassword, fullDate, currentUserKey, currentUserKey);

    if (!committeeMade) {
        res.status(401).send("Could not create committee");
    }
    else {
        res.status(200).send("Successfully made committee");
    }


});

// Delete committee

// Join committee
app.post("/api/committee/join", async (req, res) => {
    const { userCurrent, committeeCode } = req.body;

    const committeeJoined = await joinCommittee(userCurrent, committeeCode);

    if (!committeeJoined) {
        res.status(401).send("Could not join committee");
    }
    else {
        res.status(200).send("Successfully joined committee");
    }
})

// Update committee

// Get motion

// Create motion

// Delete motion

// 

/* Motion stuff
 * like getting motions and making them
 * and stuff
 */
app.get('/api/motions', async (req, res) => {
    try {
        const motions = await getMotions();
        res.json(motions);
    } catch (err) {
        res.status(500).send("Error retrieving motions");
    }
});

//TODO: API for making a motion, retrieving specific motion

// Create + Join + Delete Meeting/Chat Room
//route to chatroom
app.get('/chatroom/:motionKey', (req, res) => {
  const motionKey = req.params.motionKey;
  res.sendFile(__dirname + '/client/chatroom.html');
});

io.on("connection", (socket) => {
    socket.on('joinRoom', async (motionKey) => {
      socket.join(motionKey);
      const messages = await getChatMessages(motionKey);
      socket.emit('messageHistory', messages);
    });
  
    socket.on('chatMessage', async ({ motionKey, sender, message }) => {
        await saveChatMessage(motionKey, sender, message);
        io.to(motionKey).emit('message', { sender, message });
    });

  
    handleChatConnection(socket);
  });





app.listen(port, () => {
    console.log(`App running on port ${port}`);
});

