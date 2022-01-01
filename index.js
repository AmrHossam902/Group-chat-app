const express = require("express");


const cookieParser = require("cookie-parser");

const app = express();
const httServer= require("http").createServer(app);

let rooms = {};
const joinRequests = {};

function generateRandomString(){
    let numString = "";

    numString += (Math.random() * 10e100).toString(16).substring(0, 10);
    numString += (Math.random() * 10e100).toString(16).substring(0, 10);
    numString += (Math.random() * 10e100).toString(16).substring(0, 10);


    return Buffer.from(numString, "hex").toString("base64").substring(0,15).replace("/", "Q").replace("+", "K");

}

function authenticate(credentials){

    if(rooms[credentials.roomId] && rooms[credentials.roomId].roomPassword == credentials.roomPassword)
        return true;
    else
        return false; 
}

function createRoom(roomName){
    
    const roomId = generateRandomString();

    rooms[roomId] = {
        roomId: roomId,
        roomName : roomName,
        roomPassword : generateRandomString(),
        users: {},
        masterId: "",
        msgCount: 0,
        sessionKeyLastChanged: Date.now(),
        roomIsEmptySince: Date.now()
    }

    return rooms[roomId];
}


app.use(express.json());
app.use(cookieParser());
app.use(express.static("dist"));

app.get('/rooms/:roomId', function(req, res){
    
    const credentials = {
        roomId : req.cookies["roomId"],
        roomPassword : req.cookies["roomPassword"]
    }


    const validRequest = authenticate(credentials);
    
    if(validRequest){
        res.status(200);
        
        res.sendFile(__dirname+"/dist/views/app.html", function(err){
            res.end();
        });
    }
    else{
        res.status(300);
        res.redirect("/create-room");
    }

});

app.get(["/create-room", "/join-room", "/"], function(req, res){
    res.sendFile(__dirname+"/dist/views/app.html", function(err){
        res.end();
    });
});

app.get("/*", (req, res)=>{
    res.status(404);
    res.setHeader("Content-Type", "text/html");
    res.end("<h1> resource not found </h1>");
})

app.post("/rooms/new", (req, res)=>{
    const roomObject = createRoom(req.body["roomName"]);
    res.status(201).json(roomObject);
});

app.post("/rooms/:roomId", (req, res)=>{
    const credentials = {
        roomId: req.body.roomId,
        roomPassword: req.body.roomPassword
    }
    const validRequest = authenticate(credentials);


    if(validRequest){
        res.cookie("roomId" , credentials.roomId, {"httpOnly" : true});
        res.cookie("roomPassword" , credentials.roomPassword, {"httpOnly" : true});
        res.cookie("userName", req.body.yourName, {"httpOnly": true});
        res.cookie("userId", generateRandomString(), {"httpOnly": true});
        res.status(200).end();
    }
    else
        res.status(404).end();
});







const {Server} = require("socket.io");

const ioServer = new Server(httServer, {
    serveClient: false
});


ioServer.use((socket, next)=>{
    const middleWare = cookieParser();
    middleWare(socket.request, null, next);
});

ioServer.on("connection", (socket)=>{

    console.log("------------user connects--------------");
    console.log("   name: " + socket.request.cookies.userName );
    console.log("     id: " + socket.request.cookies.userId);
    console.log("   room: " + socket.request.cookies.roomId);
    console.log("--------- user connects end --------------");

    socket.on("disconnect", ()=>{

        console.log("-------- user disconnects -----------");
        console.log("   name: " + socket.request.cookies.userName );
        console.log("     id: " + socket.request.cookies.userId);
        console.log("   room: " + socket.request.cookies.roomId);
        console.log("-------- user disconnects end-----------");
        
        //remove user
        if(rooms[socket.request.cookies.roomId].users[socket.request.cookies.userId])   
            delete rooms[socket.request.cookies.roomId].users[socket.request.cookies.userId];
        else
            delete joinRequests[socket.request.cookies.userId];


        //change master
        const usersInRoom = rooms[socket.request.cookies.roomId].users;
        if(Object.keys(usersInRoom).length)
            rooms[socket.request.cookies.roomId].masterId = Object.keys(usersInRoom)[0];
        else{
            rooms[socket.request.cookies.roomId].masterId = "";
            //setting the room is empty at timestamp
            rooms[socket.request.cookies.roomId].roomIsEmptySince = Date.now();
        }
            

        //send user disconnect event
        ioServer.to(socket.request.cookies.roomId).emit("USER_DISCONNECT", socket.request.cookies.userId);


    });

    socket.on("JOIN_REQUEST",(data)=>{
        //extracting session info
        const userName = socket.request.cookies.userName;
        const roomId = socket.request.cookies.roomId;
        const publicKey = data.publicKey;


        //register the user in join requests
        joinRequests[socket.request.cookies.userId] = {
            socketId: socket.id,
            roomId: roomId,
            userName: userName,
            publicKey: publicKey
        }

        //check if room contains other people

        const clientsInRoomCount = Object.keys(rooms[roomId].users).length;
        if(clientsInRoomCount > 0){
            // get session key from master
            const masterSocket = ioServer.sockets.sockets.get( rooms[roomId].users[rooms[roomId].masterId].socketId );
            masterSocket.emit("SESSION_KEY_REQUEST", {
                "userPublicKey" : publicKey,
                "userId" : socket.request.cookies.userId
            });  
        }
        else{
            // send you are master
            rooms[roomId].masterId = socket.request.cookies.userId;
            socket.emit("NO_USERS_EXIST");
        }
        
    });

    socket.on("SESSION_KEY", (data)=>{
        console.log(rooms[socket.request.cookies.roomId].users);
        console.log(data);
        const recieverSocket = ioServer.sockets.sockets.get( 
            joinRequests[data.recieverId].socketId
        );

        recieverSocket.emit("SESSION_KEY", {
            encryptedKey : data.encryptedKey,
            signature : data.signature,
            masterPublicKey : rooms[socket.request.cookies.roomId].users[socket.request.cookies.userId].publicKey
        });
    });
    
    socket.on("KEY_SYNC_COMPLETE", ()=>{
        socket.join( socket.request.cookies.roomId );

        // transfer user from join requests into the room
        rooms[ socket.request.cookies.roomId ].users[ socket.request.cookies.userId ] = joinRequests[ socket.request.cookies.userId ];
        delete joinRequests[ socket.request.cookies.userId ];

        //emit meta data { roomName, userName, userId}
        socket.emit("META_DATA", 
            rooms[socket.request.cookies.roomId].roomName,
            socket.request.cookies.userName,
            socket.request.cookies.userId );
        
    });

    socket.on("CONNECTED_USERS_REQUEST", ()=>{
        
        //emit connected users
        const connectedUsers = {};
        const userIds = Object.keys(rooms[socket.request.cookies.roomId].users);
        userIds.forEach((id)=>{
            connectedUsers[id] = rooms[socket.request.cookies.roomId].users[id].userName;
        });
        socket.emit("CONNECTED_USERS", connectedUsers);

        //broadcast user connect event
        socket.broadcast.to(socket.request.cookies.roomId)
            .emit("USER_CONNECT", socket.request.cookies.userId,
                                socket.request.cookies.userName);
    });

    socket.on("SYNCHRONIZE_MSGS", (lastMsgId)=>{
        try{
            const roomMasterId = rooms[ socket.request.cookies.roomId ].masterId;
            const masterSocket = ioServer.sockets.sockets.get(
                rooms[ socket.request.cookies.roomId ].users[roomMasterId].socketId);
                
            masterSocket.emit("PREVIOUS_MSGS_REQUEST", lastMsgId, socket.request.cookies.userId );
        }
        catch(e){
            console.log(e);
        }
        
    });

    socket.on("PREVIOUS_MSGS", (prevMsgs, userId)=>{
        try{
            const userSocketId = rooms[socket.request.cookies.roomId].users[userId].socketId;
            const userSocket = ioServer.sockets.sockets.get( userSocketId);
            userSocket.emit("PREVIOUS_MSGS", prevMsgs);
        }
        catch(e){
            console.log(e);
        }
        
    });

    socket.on("PENDING_MSGS", (prendingMsgs)=>{

        const roomId = socket.request.cookies.roomId;
        const userName = socket.request.cookies.userName;
        const userId = socket.request.cookies.userId;
        prendingMsgs.forEach((encryptedMsg)=>{
            socket.broadcast.to(roomId).emit("MSG", {
                id: rooms[roomId].msgCount++,
                userId: userId,
                userName: userName,
                content: encryptedMsg
            });
        });
    });

    socket.on("NEW_MSG", (encryptedMsg, tempId)=>{

        console.log(" ------------  new message --------------");
        console.log("encryptedMsg: "+ encryptedMsg);
        console.log("      tempId: "+ tempId);
        console.log(" ------------  new message end-----------");

        let realId = rooms[socket.request.cookies.roomId].msgCount++;
        socket.emit("MSG_ACK", tempId, realId);

        socket.broadcast.to(socket.request.cookies.roomId).emit("MSG", {
            id:realId,
            userId: socket.request.cookies.userId,
            userName: socket.request.cookies.userName,
            content: encryptedMsg
        });
    });

    socket.on("NEW_SESSION_KEY", (userId, encryptedKey, signature)=>{
        
        //getting socket object 
        let socketObj = ioServer.sockets.sockets.get( 
            rooms[socket.request.cookies.roomId].users[userId].socketId );
        
        const masterPK = rooms[socket.request.cookies.roomId]
            .users[rooms[socket.request.cookies.roomId].masterId].publicKey;

        socketObj.emit("NEW_SESSION_KEY", masterPK, encryptedKey, signature);

    });

    socket.on("CHANGE_SESSION_KEY_END", ()=>{
        
        console.log("CHANGE_SESSION_KEY_END emitted");
        //remove the room lock
        ioServer.to(socket.request.cookies["roomId"])
            .emit("UNLOCK_MSGS");
            
    });

});

httServer.listen(process.env.PORT || 5555);


setInterval(()=>{

    for(const roomId in rooms) {
        //change session key only if one hour has been spent on server and 
        // there exist more than one user in the room
        if( Date.now() - rooms[roomId].sessionKeyLastChanged > 600000 // 10 mins 
            && Object.keys(rooms[roomId].users).length > 1 ){
                
                //saving the changing moment
                rooms[roomId].sessionKeyLastChanged = Date.now();

                // send message lock event to all the room
                ioServer.sockets.in(roomId).emit("LOCK_MSGS");

                //preparing users array
                let users = [];
                for (const userId in rooms[roomId].users) {
                    users.push({
                        id: userId,
                        publicKey: rooms[roomId].users[userId].publicKey
                    });
                } 

                // send change event to master
                const masterSocketId = rooms[roomId].users[ rooms[roomId].masterId ].socketId;
                ioServer.sockets.sockets.get(masterSocketId)
                    .emit("CHANGE_SESSION_KEY", users);
                
                console.log("room :" + roomId + "to change its session key");
        }

        //checking if the room is empty for long time, so delete it
        if(Object.keys( rooms[roomId].users ).length == 0 
            && Date.now() - rooms[roomId].roomIsEmptySince > 900000){ // 1/4 hour 
                delete rooms[roomId];
            }
    }
},20000);// every 20 seconds
