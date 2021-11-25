

const express = require("express");

const app = express();
const httServer= require("http").createServer(app);


app.use(express.static("dist"));


app.get(["/", '/create-room', '/join-room'], function(req, res){
    res.sendFile(__dirname+"/dist/views/home.html", function(err){
        res.end();
    });
});


app.get(['/rooms/:roomId'], function(req, res){
    res.cookie("name", "amr");
    res.sendFile(__dirname+"/dist/views/room.html", function(err){
        res.end();
    });
});

 const {Server} = require("socket.io");


 const ioServer = new Server(httServer, {
     serveClient: false
 });


 ioServer.on("connection", (socket)=>{
    console.log("connected");
    console.log(socket.request.headers);

    this.socket.emit("SESSION_KEY", "heelllo man");
    
 })
 


httServer.listen(5555);