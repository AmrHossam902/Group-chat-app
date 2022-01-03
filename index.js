const express = require("express");
const cookieParser = require("cookie-parser");
const generateRandomString = require("./utilities/randomString");
const Room = require("./Room");



const app = express();
const httServer= require("http").createServer(app);

      
const roomsManager = require("./RoomsManager");



app.use(express.json());
app.use(cookieParser());
app.use(express.static("dist"));

app.get('/rooms/:roomId', function(req, res){
    
    const credentials = {
        roomId : req.cookies["roomId"],
        roomPassword : req.cookies["roomPassword"]
    };


    try {
        if(!roomsManager.roomExists(credentials.roomId)){
            throw new Error();
        }
        const isValid = roomsManager.getRoom(credentials.roomId).authenticate(credentials);

        if(!isValid){
            throw new Error(); 
        }

        res.status(200);
        
        res.sendFile(__dirname+"/dist/views/app.html", function(err){
            res.end();
        });
        
    } catch (error) {
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

    const newRoom = new Room(req.body["roomName"]);

    roomsManager.addRoom(newRoom);

    res.status(201).json({
        roomId: newRoom.roomId,
        roomPassword: newRoom.roomPassword
    });
});

app.post("/rooms/:roomId", (req, res)=>{
    const credentials = {
        roomId: req.body.roomId,
        roomPassword: req.body.roomPassword
    }

    try{
        if(! roomsManager.roomExists(credentials.roomId))
            throw new Error();
        const isValid = roomsManager.getRoom(credentials.roomId).authenticate(credentials);

        if(!isValid)
            throw new Error();
        
        res.cookie("roomId" , credentials.roomId, {"httpOnly" : true});
        res.cookie("roomPassword" , credentials.roomPassword, {"httpOnly" : true});
        res.cookie("userName", req.body.yourName, {"httpOnly": true});
        res.cookie("userId", generateRandomString(), {"httpOnly": true});
        res.status(200).end();
    }
    catch(e){
        res.status(404).end();
    }
    
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
        
        const room = roomsManager.getRoom(socket.request.cookies.roomId);
        //remove user
        room.deleteUser(socket.request.cookies.userId);

            
        //send user disconnect event
        ioServer.to(room.roomId).emit("USER_DISCONNECT", socket.request.cookies.userId);


    });

    socket.on("JOIN_REQUEST",(data)=>{
        //extracting session info
        const userName = socket.request.cookies.userName;
        const roomId = socket.request.cookies.roomId;
        const userId = socket.request.cookies.userId;
        const publicKey = data.publicKey;


        

        const room = roomsManager.getRoom(roomId);


        if(room.isEmpty()){
            //this user is the master
            
            //add user to the room
            room.addUser(userId,{
                socketId: socket.id,
                roomId: roomId,
                userName: userName,
                publicKey: publicKey
            });
            socket.join( roomId );

            //make him the master
            room.assignNewMaster();


            //emit that no users in the room
            socket.emit("NO_USERS_EXIST");
        }else{

            //register the user in join requests
            roomsManager.registerJoinRequest(userId,{
                socketId: socket.id,
                roomId: roomId,
                userName: userName,
                publicKey: publicKey
            });

            // get session key from master
            const masterSocket = ioServer.sockets.sockets.get( room.getMaster().socketId );
            masterSocket.emit("SESSION_KEY_REQUEST", {
                "userPublicKey" : publicKey,
                "userId" : userId
            }); 

        }
    });

    socket.on("SESSION_KEY", (data)=>{

        const recieverSocket = ioServer.sockets.sockets.get( 
            roomsManager.getJoinRequest( data.recieverId).socketId
        );

        recieverSocket.emit("SESSION_KEY", {
            encryptedKey : data.encryptedKey,
            signature : data.signature,
            masterPublicKey : roomsManager.getRoom(socket.request.cookies.roomId).getMaster().publicKey
        });
    });
    
    socket.on("KEY_SYNC_COMPLETE", ()=>{

        const room  = roomsManager.getRoom(socket.request.cookies.roomId);

        if(socket.request.cookies.userId != room.masterId){
            socket.join( socket.request.cookies.roomId );

            // transfer user from join requests into the room
            roomsManager.moveJoinReqToRoom(room.roomId, socket.request.cookies.userId);
        }
        

        //emit meta data { roomName, userName, userId}
        socket.emit("META_DATA", 
            room.roomName,
            socket.request.cookies.userName,
            socket.request.cookies.userId );
        
    });

    socket.on("CONNECTED_USERS_REQUEST", ()=>{
        
        const room = roomsManager.getRoom(socket.request.cookies.roomId);

        //emit connected users
        const connectedUsers = {};

        for (const userId in room.users) {
            connectedUsers[userId] = room.users[userId].userName;
        }

        socket.emit("CONNECTED_USERS", connectedUsers);

        //broadcast user connect event
        socket.broadcast.to(room.roomId)
            .emit("USER_CONNECT", socket.request.cookies.userId,
                                socket.request.cookies.userName);
    });

    socket.on("SYNCHRONIZE_MSGS", (lastMsgId)=>{
        try{
            const masterSocket = ioServer.sockets.sockets.get(
                roomsManager.getRoom(socket.request.cookies.roomId).getMaster().socketId);
                
            masterSocket.emit("PREVIOUS_MSGS_REQUEST", lastMsgId, socket.request.cookies.userId );
        }
        catch(e){
            console.log(e);
        }
        
    });

    socket.on("PREVIOUS_MSGS", (prevMsgs, userId)=>{
        try{

            ioServer.sockets.sockets.get( 
                roomsManager.getRoom(socket.request.cookies.roomId).getUser(userId).socketId
            )
            .emit("PREVIOUS_MSGS", prevMsgs);

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

        const room = roomsManager.getRoom(socket.request.cookies.roomId);
        let realId = room.getNewMsgId();

        socket.emit("MSG_ACK", tempId, realId);

        socket.broadcast.to(room.roomId).emit("MSG", {
            id:realId,
            userId: socket.request.cookies.userId,
            userName: socket.request.cookies.userName,
            content: encryptedMsg
        });
    });

    socket.on("NEW_SESSION_KEY", (userId, encryptedKey, signature)=>{
        
        const room = roomsManager.getRoom(socket.request.cookies.roomId);

        room.updateSesssionKeyLastChanged();

        //getting socket object 
        ioServer.sockets.sockets.get( 
            room.users[userId].socketId
        )
        .emit("NEW_SESSION_KEY", room.getMaster().publicKey, encryptedKey, signature);

    });

    socket.on("CHANGE_SESSION_KEY_END", ()=>{
        
        console.log("CHANGE_SESSION_KEY_END emitted");
        //remove the room lock
        ioServer.to(socket.request.cookies.roomId)
            .emit("UNLOCK_MSGS");
            
    });

});

httServer.listen(process.env.PORT || 5555);


setInterval(()=>{


    roomsManager.exectutePerRoom(function(roomId){
        //change session key only if one hour has been spent on server and 
        // there exist more than one user in the room
        const room = roomsManager.getRoom(roomId);

        if( Date.now() - room.sessionKeyLastChanged > 600000 // 10 mins 
            && Object.keys(room.users).length > 1 ){
                
                // send message lock event to all the room
                ioServer.sockets.in(roomId).emit("LOCK_MSGS");

                //preparing users array
                let users = [];
                for (const userId in room.users) {
                    users.push({
                        id: userId,
                        publicKey: room.users[userId].publicKey
                    });
                } 

                // send change event to master
                ioServer.sockets.sockets.get(room.getMaster().socketId)
                    .emit("CHANGE_SESSION_KEY", users);
                
        }

        //checking if the room is empty for long time, so delete it
        if(room.isEmpty()
            && Date.now() - room.roomIsEmptySince > 900000){ // 1/4 hour 
                roomsManager.deleteRoom(roomId);
            }
    });

},120000);// every 2 mins
