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

function createRoom(roomName){
    
    const roomId = generateRandomString();

    rooms[roomId] = {
        roomId: roomId,
        roomName : roomName,
        roomPassword : generateRandomString(),
        users: {},
        masterId: "",
        msgCount: 0
    }

    return rooms[roomId];
}


app.use(express.json());
app.use(cookieParser());
app.use(express.static("dist"));


app.get(["/", '/create-room', '/join-room'], function(req, res){
    res.sendFile(__dirname+"/dist/views/home.html", function(err){
        res.end();
    });
});

app.post("/rooms/new", (req, res)=>{
    const roomObject = createRoom(req.body["roomName"]);
    res.status(201).json(roomObject);
});


 function authenticate(credentials){

    if(rooms[credentials.roomId] && rooms[credentials.roomId].roomPassword == credentials.roomPassword)
        return true;
    else
        return false; 
}

app.get(['/rooms/:roomId'], function(req, res){
    
    const credentials = {
        roomId : req.cookies["roomId"],
        roomPassword : req.cookies["roomPassword"]
    }
    console.log(credentials);

    const validRequest = authenticate(credentials);
    
    if(validRequest){
        res.status(200);
        res.sendFile(__dirname+"/dist/views/room.html", function(err){
            res.end();
        });
    }
    else{
        res.status(401);
        res.end("<h1>Invalid credentials</h1>");
    }

});


app.post("/rooms/:roomId", (req, res)=>{
    const credentials = {
        roomId: req.body.roomId,
        roomPassword: req.body.roomPassword
    }
    const validRequest = authenticate(credentials);

    console.log(req.body);
    console.log(credentials);
    console.log(validRequest);

    if(validRequest){
        res.cookie("roomId" , credentials.roomId, {"httpOnly" : true});
        res.cookie("roomPassword" , credentials.roomPassword, {"httpOnly" : true});
        res.cookie("userName", req.body.yourName, {"httpOnly": true});
        res.status(200).end();
    }
    else
        res.status(404).end();
})


const {Server} = require("socket.io");

const ioServer = new Server(httServer, {
    serveClient: false
});


ioServer.use((socket, next)=>{
    const middleWare = cookieParser();
    middleWare(socket.request, null, next);
});

ioServer.on("connection", (socket)=>{
    console.log("connected");
    console.log(socket.request.cookies);

    socket.on("JOIN_REQUEST",(data)=>{
        //extracting session info
        const userName = socket.request.cookies.userName;
        const roomId = socket.request.cookies.roomId;
        const publicKey = data.publicKey;


        //register the user in join requests
        joinRequests[socket.id] = {
            roomId: roomId,
            userName: userName,
            publicKey: publicKey
        }

        //check if room contains other people
        console.log(rooms[roomId]);
        const clientsInRoomCount = Object.keys(rooms[roomId].users).length;
        if(clientsInRoomCount > 0){
            // get session key from master
            const masterSocket = ioServer.sockets.sockets.get( rooms[roomId].masterId );
            masterSocket.emit("SESSION_KEY_REQUEST", {
                "userPublicKey" : publicKey,
                "userSocketId" : socket.id
            });  
        }
        else{
            // send you are master
            rooms[roomId].masterId = socket.id;
            socket.emit("NO_USERS_EXIST");
        }
        
    });

    socket.on("SESSION_KEY", (data)=>{
        const recieverSocket = ioServer.sockets.sockets.get(data.recieverSocketId);

        recieverSocket.emit("SESSION_KEY", {
            encryptedKey : data.encryptedKey,
            signature : data.signature,
            masterPublicKey : rooms[socket.request.cookies.roomId].users[socket.id].publicKey
        });
    });
    
    socket.on("KEY_SYNC_COMPLETE", ()=>{
        socket.join( socket.request.cookies.roomId );

        // transfer user from join requests into the room
        rooms[ socket.request.cookies.roomId ].users[ socket.id ] = joinRequests[ socket.id ];
        delete joinRequests[ socket.id ];

        //emit meta data { roomName, userName}
        socket.emit("META_DATA", rooms[socket.request.cookies.roomId].roomName, socket.request.cookies.userName);
        
    });

    socket.on("CONNECTED_USERS_REQUEST", ()=>{
        
        //emit connected users
        const connectedUsers = {};
        const userIds = Object.keys(rooms[socket.request.cookies.roomId].users);
        userIds.forEach((id)=>{
            connectedUsers[id] = rooms[socket.request.cookies.roomId].users[id].userName;
        });
        socket.emit("CONNECTED_USERS", connectedUsers);
    });

    socket.on("SYNCHRONIZE_MSGS", (lastMsgId)=>{
        try{
            const masterSocket = ioServer.sockets.sockets.get(rooms[ socket.request.cookies.roomId ].masterId);
            masterSocket.emit("PREVIOUS_MSGS_REQUEST", lastMsgId, socket.id );
        }
        catch(e){
            console.log(e);
        }
        
    });

    socket.on("PREVIOUS_MSGS", (prevMsgs, userId)=>{
        try{
            const userSocket = ioServer.sockets.sockets.get(userId);
            userSocket.emit("PREVIOUS_MSGS", prevMsgs);
        }
        catch(e){
            console.log(e);
        }
        
    });

    socket.on("PENDING_MSGS", (prendingMsgs)=>{

        const roomId = socket.request.headers.cookies.roomId;
        const userName = socket.request.headers.cookies.userName;
        prendingMsgs.forEach((encryptedMsg)=>{
            ioServer.sockets.in(roomId).except(socket.id).emit("MSG", {
                id: rooms[roomId].msgCount++,
                sender: userName,
                content: encryptedMsg
            });
        });
    });

    socket.on("NEW_MSG", (encryptedMsg, tempId)=>{
        let realId = rooms[socket.request.cookies.roomId].msgCount++;
        socket.emit("MSG_ACK", tempId, realId);

        socket.broadcast.to(socket.request.cookies.roomId).emit("MSG", {
            id:realId,
            sender: socket.request.cookies.userName,
            content: encryptedMsg
        });
    });

});

httServer.listen(5555);