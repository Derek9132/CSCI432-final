import env from 'dotenv'
import bcrypt from 'bcrypt'
import mssql from "mssql"






env.config();

/** NOTES AND TIPS **/

// Use template strings to build queries
// desired data is usually stored in .recordset[0]



const config = {
    server: process.env.AZURE_SQL_SERVER, // better stored in an app setting such as process.env.DB_SERVER
    database: process.env.AZURE_SQL_DATABASE, // better stored in an app setting such as process.env.DB_NAME
    authentication: {
        type: 'default'
    },
    user: process.env.AZURE_SQL_USER,
    password: process.env.AZURE_SQL_PASSWORD,
    options: {
        encrypt: true
    }
}

async function connectAndQuery() {
    try {
        var poolConnection = await mssql.connect(config);

        console.log("Reading rows from the Table...");
        var resultSet = await poolConnection.request().query(`SELECT * from user_info`);
        //console.log(resultSet.recordset);

        // close connection only when we're certain application is finished
        //poolConnection.close();
    } catch (err) {
        console.error(err.message);
    }
}

export async function getUser(username, enteredPassword) {
    var poolConnection = await mssql.connect(config); // wait until connection is complete
    try {
        // check if username in table
        var getUserRow = await poolConnection.request()
        .input("username", mssql.VarChar, username)
        .query(`SELECT * FROM user_info WHERE username=@username`); // build query
        if (getUserRow.recordset.length === 0) {
            // error code: no user found
            console.log("No user");
        }
        else {
            console.log("else triggered");
            // retrieve user password
            var userPassword = await getUserRow.recordset[0].password; // desired data stored in .recordset[0] (in this case, contains key, username, password, first name, last name, email, pfp file path)

            const res = await bcrypt.compare(enteredPassword, userPassword);
            console.log("found user");
            if (res) {
                return getUserRow.recordset[0];
            }
            else {
                return false;
            }
            
        }
    }
    catch (err) {
        console.log("Could not connect to database");
    }
    /**
     * var poolConnection = await mssql.connect(config).then();
     */
}

/**
 * JWT - ensures access to data, 
 */


// Turn into prepared statements
export async function makeUser(username, password, fname, lname, email, date,pfp_path) {
    try {
        var poolConnection = await mssql.connect(config);

        // check if username exists

        // generate bcrypt salts
        const saltNum = 10;

        bcrypt.genSalt(saltNum, (err, salts) => {
            if (err) {
                console.log("Failed to generate salts");
                return;
            }
            // hash password 
            console.log("successfully generated salts");
            bcrypt.hash(password, salts, (err, hash) => {
                if (err) {
                    console.log("Failed to hash password");
                    return;
                }
                console.log("successfully hashed password");
                // store in database
                var create = poolConnection.request()
                .input("username", mssql.VarChar, username)
                .input("password", mssql.VarChar, hash)
                .input("firstName", mssql.VarChar, fname)
                .input("lastName", mssql.VarChar, lname)
                .input("email", mssql.VarChar, email)
                .input("date_created", mssql.VarChar, date)
                .input("pfpPath", mssql.VarChar, pfp_path)
                .query(`INSERT INTO user_info 
                    (username, password, firstName, lastName,email,date_created,pfpPath) VALUES 
                    (@username, @password, @firstName, @lastName, @email, @date_created, @pfpPath)`);

            })
        });

    }
    catch (err) {
        console.log("registration error - could not connect", err)
    }
}

export async function deleteUser() {

}

export async function updateUser() {

}

export async function createCommittee(cname, cpassword, date, creatorID, chairmanID, votesNeeded) {
    try {
        var poolConnection = await mssql.connect(config);

        // add committee 
        var addCommittee = await poolConnection.request()
        .input("cname", mssql.VarChar, cname)
        .input("cpassword", mssql.VarChar, cpassword)
        .input("chairmanID", mssql.Int, chairmanID)
        .input("creatorID", mssql.Int, creatorID)
        .input("date", mssql.VarChar, date)
        .input("votesNeeded", mssql.Int, votesNeeded)
        .query(`INSERT INTO committee_info (committeeName, committeePassword,chairmanID, creatorID, date_created, votes_to_pass) 
            OUTPUT inserted.committeeKey 
            VALUES (@cname, @cpassword, @chairmanID, @creatorID, @date, @votesNeeded)`);

        // get committee id
        const committeeID = addCommittee.recordset[0].committeeKey;

        // add creatorID and committeeID to junction table
        var addJunction = await poolConnection.request()
        .input("creatorID", mssql.Int, creatorID)
        .input("committeeID", mssql.Int, committeeID)
        .query(`INSERT INTO user_committee_junction (userKey, committeeKey) VALUES (@creatorID, @committeeID)`);

        return true;
    }
    catch (err) {
        console.log("Could not create committee", err)

        return false;
    }
}

export async function getCommittees(currentUserKey) {
    try {
        var poolConnection = await mssql.connect(config);

        var resultSet = await poolConnection.request()
        .input("currentUserKey", mssql.Int, currentUserKey)
        .query(`SELECT c.committeeKey, c.committeeName
                FROM committee_info c
                JOIN user_committee_junction uc ON c.committeeKey = uc.committeeKey
                JOIN user_info u ON uc.userKey = u.userKey
                WHERE u.userKey=@currentUserKey`);

        if (resultSet.recordset.length === 0) {
            return false;
        }
        else {
            return resultSet.recordset;
        }
    }
    catch (err) {
        console.log("Could not connect to database", err)
    }
}


export async function getCommitteeByKey(ckey) {
    try {
        var poolConnection = await mssql.connect(config);

        var foundCommittee = await poolConnection.request()
        .input("ckey", mssql.Int, ckey)
        .query(`SELECT * from committee_info WHERE committeeKey=@ckey`);

        if (foundCommittee.recordset.length === 0) {
            return false
        }
        else {
            return foundCommittee.recordset;
        }
    }
    catch (err) {
        console.log("Could not get committee by key:", err);
    }
}

export async function getChairman(ckey) {
    try {
        var poolConnection = await mssql.connect(config);

        var foundChairman = await poolConnection.request()
        .input("ckey", mssql.Int, ckey)
        .query(`SELECT chairmanID FROM committee_info WHERE committeeKey=@ckey`);

        if (foundChairman.recordset.length === 0) {
            return false;
        }
        else {
            return foundChairman.recordset;
        }

    }
    catch (err) {
        console.log("Could not get chairman:", err);
    }
}

export async function getCommitteeMembers(ckey) {
    try {
        var poolConnection = await mssql.connect(config);

        var membersInCommittee = await poolConnection.request()
        .input("cKey", mssql.Int, ckey)
        .query(`SELECT c.userKey, c.username, c.firstName, c.lastName, c.email, c.pfpPath
            FROM user_info c
            JOIN user_committee_junction uc ON c.userKey = uc.userKey
            JOIN committee_info u ON uc.committeeKey = u.committeeKey
            WHERE u.committeeKey=@cKey`);
        
        if (membersInCommittee.recordset.length === 0) {
            return false;
        }
        else {
            return membersInCommittee.recordset;
        }

    }
    catch (err) {
        console.log("Could not get committee members:", err)
    }
}

export async function joinCommittee(currentUserKey, committeeCode) {
    try {
        var poolConnection = await mssql.connect(config);

        var committeeToJoin = await poolConnection.request()
        .input("committeeCode", mssql.VarChar, committeeCode)
        .query(`SELECT committeeKey FROM committee_info WHERE committeePassword=@committeeCode`);

        if (committeeToJoin.recordset.length === 0) {
            console.log("No committee with code found");
            return false;
        }
        else {
            // store committee key
            const matchingCommitteeKey = committeeToJoin.recordset[0].committeeKey;

            console.log("committee key:", matchingCommitteeKey);

            // store in junction table
            var userJoin = await poolConnection.request()
            .input("currentUserKey", mssql.Int, currentUserKey)
            .input("matchingCommitteeKey", mssql.Int, matchingCommitteeKey)
            .query(`INSERT INTO user_committee_junction 
                (userKey, committeeKey) VALUES (@currentUserKey, @matchingCommitteeKey)`);

            console.log("Committee Joined");
            return true;


        }
    }
    catch (err) {
        console.log("Could not join committee:", err);
    }
}

export async function deleteCommittee(committeeKey) {

}

/*console.log(await getUser("orange", "pineapple"));
console.log(await getUser("run", "dev"));
console.log(await getUser("gen5", "bestgen"));*/


// Motions stuff

export async function makeMotion(title, desc, creator, committeeKey, creatorKey) {
    try {
        var poolConnection = await mssql.connect(config);

        //var create = await poolConnection.request().query(`INSERT INTO motions (title, description, date, creator, committeeKey, userKey) OUTPUT inserted.motionKey VALUES ('${title}','${desc}', GETDATE(), '${creator}', '${committeeKey}','${creatorKey}')`); 

        var create = await poolConnection.request()
            .input('title', mssql.NVarChar, title)
            .input('desc', mssql.NVarChar, desc)
            .input('creator', mssql.NVarChar, creator)
            .input('committeeKey', mssql.Int, committeeKey)
            .input('creatorKey', mssql.Int, creatorKey)
            .query(`INSERT INTO motions (title, description, date, creator, committeeKey, userKey) 
                    OUTPUT inserted.motionKey 
                    VALUES (@title, @desc, GETDATE(), @creator, @committeeKey, @creatorKey)`);

        if (!create) {
            return false;
        }
        else {
            return create.recordset;
        }
    }
    catch (err) {
        console.log("Error creating motion:", err);
    }
}

// retrieve all motions
export async function getMotions() {
    try {
        var poolConnection = await mssql.connect(config);
        const result = await poolConnection.request().query(`
            SELECT motionKey, title, description, creator, date
            FROM motions
            ORDER BY date DESC
        `);
        return result.recordset;
    } catch (err) {
        console.log("Error retrieving motion:", err);
        return [];
    }
}

export async function updateMotion(userID, motionID) {
    try {
        let poolConnection = await mssql.connect(config);

        // check if user has already voted on motion
        const check = await poolConnection.request()
        .input('userKey', mssql.Int, userID)
        .input('motionKey', mssql.Int, motionID)
        .query(`SELECT * FROM user_motionVote_junction WHERE userID=@userKey AND motionID=@motionKey`);

        // if user already voted, remove user and vote, return
        if (check.recordset.length > 0) {
            //const removeMotionUpvote = await poolConnection.request().query(`DELETE FROM user_motionVote_junction WHERE userID=${userID} AND motionID=${motionID}`);
            const removeMotionUpvote = await poolConnection.request()
            .input('userKey', mssql.Int, userID)
            .input('motionKey', mssql.Int, motionID)
            .query(`DELETE FROM user_motionVote_junction WHERE userID=@userKey AND motionID=@motionKey`);
        }
        else { // else, add user's vote to motion
            //const addMotionUpvote = await poolConnection.request().query(`INSERT INTO user_motionVote_junction VALUES (${userID}, ${motionID})`);
            const addMotionUpvote = await poolConnection.request()
            .input('userKey', mssql.Int, userID)
            .input('motionKey', mssql.Int, motionID)
            .query(`INSERT INTO user_motionVote_junction VALUES (@userKey, @motionKey)`);
        }
        
        // count total number of votes
        const countVotes = await poolConnection.request()
        .input("motionAtKey", mssql.Int, motionID)
        .query(`SELECT * FROM user_motionVote_junction WHERE motionID=@motionAtKey`);
        return countVotes.recordset.length;
    }
    catch (err) {
        console.log("Could not update motion: ", err)
        return false;
    }
}



// retrive # of votes for a motion
export async function getMotionVotesByKey(motionKey) {
    try {
        var poolConnection = await mssql.connect(config);
        const result = await poolConnection.request()
            .input("motionKey", mssql.Int, motionKey)
            .query(`
            SELECT * FROM user_motionVote_junction
            WHERE motionID=@motionKey`);
        return result.recordset.length;
    } catch (err) {
        console.log("Error retrieving motion:", err);
        return false;
    }
}

export async function getMotionsByCommittee(committeeKey) {
    try {
        var poolConnection = await mssql.connect(config);
        const result = await poolConnection.request()
            .input("committeeKey", mssql.Int, committeeKey)
            .query(`
            SELECT *
            FROM motions
            WHERE committeeKey=@committeeKey
            ORDER BY date DESC
        `);
        return result.recordset;
    } catch (err) {
        console.log("Error retrieving motions by committeeKey:", err);
        return [];
    }
}

export async function getPastMotionsByCommittee(committeeKey) {
    try {
        var poolConnection = await mssql.connect(config);
        const result = await poolConnection.request()
            .input("committeeKey", mssql.Int, committeeKey)
            .query(`
            SELECT *
            FROM past_motions
            WHERE committeeKey=@committeeKey 
            ORDER BY dateMade DESC
        `);
        return result.recordset;
    } catch (err) {
        console.log("Error retrieving motions by committeeKey:", err);
        return [];
    }
}

// move motion to archive after ending vote
export async function closeMotion(motionKey, isPassed) {
    try {
        // ispassed: true if passed, false if failed
        var poolConnection = await mssql.connect(config);
    
        // fetch motion information from motion table first
        const motionInfo = await poolConnection.request()
        .input("motionNum", mssql.Int, motionKey)
        .query(`SELECT * FROM motions WHERE motionKey=@motionNum`);

        // something wrong with date info stuff; wont insert into past_motions if i include date
        // insert motion into archive
        const insertMotion = await poolConnection.request()
            .input("motionKey", mssql.Int, motionInfo.recordset[0].motionKey)
            .input("title", mssql.VarChar, motionInfo.recordset[0].title)
            .input("desc", mssql.VarChar, motionInfo.recordset[0].description)
            .input("creator", mssql.VarChar, motionInfo.recordset[0].creator)
            .input("committeeKey", mssql.Int, motionInfo.recordset[0].committeeKey)
            .input("userKey", mssql.Int, motionInfo.recordset[0].userKey)
            .input("isPassed", mssql.Bit, isPassed)
            .query(`INSERT INTO past_motions (motionKey, title, description, creator, committeeKey, userKey, isPassed)
            VALUES (@motionKey, @title, @desc, @creator, @committeeKey, @userKey, @isPassed)`);

        // delete motion from motions table
        const deleteMotion = await poolConnection.request()
        .input("motionKey", mssql.Int, motionKey)
        .query(`
            DELETE FROM motions
            WHERE motionKey=@motionKey`);
        return true;

    } catch (err) {
        console.log("Error closing motion:", err);
        return false;
    }

}

// User + Message Stuff
export async function saveComment(motionKey, userID, senderName, message, timestamp) {
    try {
        var poolConnection = await mssql.connect(config);
        await poolConnection.request()
            .input("motionKey", mssql.Int, motionKey)
            .input("userID", mssql.Int, userID)
            .input("senderName", mssql.VarChar, senderName)
            .input("message", mssql.VarChar, message)
            .input("timestamp", mssql.VarChar, timestamp)
            .query(`
            INSERT INTO motion_messages (motionKey, senderID, senderName, message, timestamp)
            VALUES (@motionKey, @userID, @senderName, @message, @timestamp)`);
    } catch (err) {
        console.log("Error saving chat message:", err);
    }
}

export async function getComments(motionKey) {
    try {
        var poolConnection = await mssql.connect(config);
        const result = await poolConnection.request()
        .input("motionKey", mssql.Int, motionKey)
        .query(`
            SELECT senderName, message, timestamp
            FROM motion_messages
            WHERE motionKey=@motionKey
            ORDER BY timestamp ASC
        `);
        return result.recordset;
    } catch (err) {
        console.log("Error retrieving chat messages:", err);
        return [];
    }
}


console.log("...Starting");
//connectAndQuery();


