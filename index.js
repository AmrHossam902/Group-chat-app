const express = require("express");

const app = express();

app.use(express.static("dist"));


app.get(["/", '/create-room', '/join-room'], function(req, res){
    res.sendFile(__dirname+"/dist/views/home.html", function(err){
        res.end();
    });
});


app.get(['/rooms/:roomId'], function(req, res){
    res.sendFile(__dirname+"/dist/views/room.html", function(err){
        res.end();
    });
});

app.listen(5555);