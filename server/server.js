import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import express from 'express'
import cors from 'cors'
import { getUser, makeUser, getCommittees, createCommittee, getCommitteeByKey, getCommitteeMembers, joinCommittee, updateMotion, getMotionVotesByKey } from './database.js';
import { saveComment, getComments } from './database.js';
import { getMotions, getMotionsByCommittee, getPastMotionsByCommittee, makeMotion, closeMotion} from './database.js';
import { upload }  from './multerSetup.js'

import bodyParser from 'body-parser';
import token from 'jsonwebtoken'
import { Server } from "socket.io";

import { createServer } from "node:http";

  
import {handleChatConnection} from "./chatController.js"; 
import {setIoInstance} from './chatController.js';

/**NOTES AND TIPS **/
 
// HTTP Methods
// POST - send data to server, usually to create a new resource
// GET - request data from server
// PUT - update a resource (there probably isn't a need to use this for this project)
// DELETE - delete a resource

// endpoint on server and fetch method in frontend must be the same
// Example: login uses fetch with post method on frontend (script.js) so /api/login must also use app.post()
// response codes are important: 200 means OK, 401 means authentication error, 404 is not found error, 500 is internal server error
// Sending a response code from the server and using response.ok on the frontend returns true if the response code is between 200-299
// res: response, req: request
// URL parameters are a way to send information to the server without using a POST request
    // How they work: user adds ?key=value at the end of a url
    // server can receive it at the endpoint /api/:value and use const value = req.params.key
// Use req.body with POST and PUT
// Use req.params for GET and DELETE with query parameters



/**TO DO **/
// CRUD - create, read, update, delete
// Need CRUD for users, committees, motions (at least 12 endpoints)
// Users - Create and Read done, Update and Delete need to be implemented (use POST for update)
// Committees - Create, Read, Update done, Delete needed (only chairman/creator can delete)
// Motions - Create and Read done, Update and Delete need to be implemented (update = upvotes and downvotes)
// Remaining endpoints: At least 5



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

//app.use(cors({origin: "http://127.0.0.1:5500"}));

const allowedOrigins = [
    "http://127.0.0.1:5500", // Development
    "https://web-programming-3wtf.vercel.app/" // Production
  ];

app.use(
cors({
    origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    // Allow only specified origins
    if (allowedOrigins.includes(origin)) {
        return callback(null, true);
    }

    // Reject other origins
    return callback(new Error("Not allowed by CORS"));
    }
})
);
  
  // Configure CORS middleware
  // app.options("*", cors());

/*app.use(
cors({ origin: "*"})
);*/

// app.use(cors({origin: "http://127.0.0.1:5500"}))

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
app.post("/api/register", async (req, res) => { // make sure to have async in each endpoint 
    // since it takes time to fetch from database
    console.log("reached api");
    upload (req, res, async (err) => {
        console.log("reached upload");
        if (err) {
            return res.status(400).send({ message: "File upload error", error: err.message });
        }

        const {username, password,fname, lname, email} = req.body; // receive data from request

        if (!req.file) {
            return res.status(400).send({ message: "Profile image is required" });
        }

        const profileImagePath = req.file.path; // Path to the uploaded profile image

        // get current date
        let currentDate = new Date();
    
        let date = ("0" + currentDate.getDate()).slice(-2);
    
        // get current month
        let month = ("0" + (currentDate.getMonth() + 1)).slice(-2);
    
        // get current year
        let year = currentDate.getFullYear();
        
        // create string
        let fullDate = year + "-" + month + "-" + date;
        try {
    
        makeUser(username,password,fname,lname,email,fullDate, profileImagePath); // send image to database
    
        res.status(200).send("Registration Success");
        }
        catch (err) {
            console.log("Could not create user:", err);
            res.status(401).send("Could not create user");
        }

    });
});


// User authentication
app.post("/api/login", async (req, res) => {
    const { username, password } = req.body; // receive username and password from frontend
    const result = await getUser(username, password); // send info to database method, store in result
    // const result = getUser(username, password);

    if (!result) { // database returns false if user not found or password incorrect
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

        res.status(200).send({ 
            userData: userInfo // send response code and user data up to frontend
        });
    }
    

});


// Update user
app.put("/api/dashboard/profile/update", (req, res) => {

});

// Delete user
app.delete("api/:user/delete", (req, res) => {

});

// Get committees associated with user
app.post("/api/dashboard/committee", async (req, res) => {
    const { currentKey } = req.body; // server receives current user key
    const committeesResponse = await getCommittees(currentKey); // gets all committees the user is in

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

// Used in committee_template.js, URL parameter set in dashboard.js
app.get("/api/committee/:committeeKey", async (req,res) => { // this one uses URL parameters to get the key of the committee the user clicked
    const committeeKey = req.params.committeeKey; // store key of committee

    const committeeFound = await getCommitteeByKey(committeeKey); // send to database

    if (!committeeFound) {
        res.status(404).send("Committee not found");
    }
    else {
        res.status(200).send({
            committeeAtKey: committeeFound // respond with committee data
        });
    }

});

// Used in committee_template.js, URL parameter set in dashboard.js
app.get("/api/committee/:committeeKey/users", async (req, res) => { // this one too
    const committeeKey = req.params.committeeKey; // key of committee that is clicked

    const committeeFound = await getCommitteeMembers(committeeKey); // remember to put await before database functions

    if (!committeeFound) {
        res.status(404).send("Committee not found");
    }
    else {
        res.status(200).send({
            committeeMembers: committeeFound // respond with members in committee
        });
    }
});


// Create committee
app.post("/api/committee/create", async (req, res) => {
    const {cname, cpassword,currentUserKey, cVotesNeeded} = req.body; // server receives committee name and password and the key of the user making it

    // create date
    let currentDate = new Date();
    let date = ("0" + currentDate.getDate()).slice(-2);
    let month = ("0" + (currentDate.getMonth() + 1)).slice(-2);
    let year = currentDate.getFullYear();
    let fullDate = year + "-" + month + "-" + date;

    // send to database
    const committeeMade = await createCommittee(cname, cpassword, fullDate, currentUserKey, currentUserKey, cVotesNeeded);

    if (!committeeMade) {
        res.status(500).send("Could not create committee");
    }
    else {
        res.status(200).send("Successfully made committee");
    }

});

// Delete committee

// Join committee
app.post("/api/committee/join", async (req, res) => { 
    const { userCurrent, committeeCode } = req.body; // server receives committee code and the user who wants to join

    const committeeJoined = await joinCommittee(userCurrent, committeeCode); //update database

    if (!committeeJoined) {
        res.status(401).send("Could not join committee");
    }
    else {
        res.status(200).send("Successfully joined committee");
    }
})

// Update committee

// Get motion
// get all motions
app.get('/api/motions', async (req, res) => {
    try {
        const motions = await getMotions();
        res.json(motions);
    } catch (err) {
        res.status(500).send("Error retrieving motions");
    }
});

// get motions from a specific committee
app.get('/api/motions/:committeeKey', async (req, res) => {
    //console.log("r", req)
    const committeeKey = req.params.committeeKey;
    try {
        const motions = await getMotionsByCommittee(committeeKey);
        res.json(motions);
    } catch (err) {
        console.error("Error retrieving motions:", err);
        res.status(500).send("Error retrieving motions");
    }
});

// get past motions from specific committee
app.get('/api/motions/past/:committeeKey', async (req, res) => {
    const committeeKey = req.params.committeeKey;
    try {
        const motions = await getPastMotionsByCommittee(committeeKey);
        res.json(motions);
    } catch (err) {
        console.error("Error retrieving motions:", err);
        res.status(500).send("Error retrieving motions");
    }
});

// Create motion
app.post("/api/motion/make", async (req, res) => {
    const {title, desc, creator, committeeKey, creatorKey} = req.body;


    const motionMade = await makeMotion(title, desc, creator, committeeKey, creatorKey);

    if (!motionMade) {
        res.status(500).send("Could not create motion");
    }
    else {
        res.status(200).send({
            newMotionKey: motionMade
        });
    }
});

// update / vote on motion
app.post("/api/motion/vote", async (req, res) => {
    const {userID, motionID} = req.body;

    //console.log(userID, motionID);

    const motionUpdate = await updateMotion(userID, motionID);
    //console.log(motionUpdate);
    /**if (!motionUpdate) {
        res.status(401).send("could not update motion");
    }
    else {**/
    res.status(200).send({
        votes: motionUpdate
    });
    //}
});

app.post("/api/motion/getVotes", async (req, res) => {
    const {motionNum} = req.body;
    const numVotes = await getMotionVotesByKey(motionNum);
    /*if (!numVotes) {
        res.status(401).send("could not get votes");
    }
    else {*/
    res.status(200).send({
        votes: numVotes
    });
    //}
})

// end vote on motion
app.post("/api/motion/endVote", async (req, res) => {
    // get motion id and if it passes or not
    const {motionNum, isPassed} = req.body;
    console.log(motionNum, isPassed);
    const motionUpdate = await closeMotion(motionNum, isPassed);
    res.status(200).send(("Motion closed"));

});


// Delete motion

// 

/* Motion stuff
 * like getting motions and making them
 * and stuff
 */


//route to comments
app.get('/api/comments/:motionKey', async (req, res) => {
    console.log("hello");
    const motionKey = req.params.motionKey;
    try {
        const comments = await getComments(motionKey); // Fetch comments from the database
        res.json(comments);
    } catch (err) {
        console.error("Error retrieving comments:", err);
        res.status(500).send("Error retrieving comments");
    }
});

app.post('/api/post_comment/:motionKey', async (req, res) => {
    const motionKey = req.params.motionKey;
    const { userID, senderName, message, motionID, timestamp } = req.body;
    try {
        await saveComment(motionKey, userID, senderName, message, timestamp); // Save new comment to the database
        res.status(201).json({ senderName, message });
    } catch (err) {
        console.error("Error saving comment:", err);
        res.status(500).send("Error saving comment");
    }
});

app.listen(port, () => {
    console.log(`App running on port ${port}`);
});

