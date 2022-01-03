const generateRandomString = require("./utilities/randomString");

function Room(roomName){
    
    this.roomName = roomName;
    this.roomId = generateRandomString();
    this.roomPassword = generateRandomString();
    this.users = {};
    this.masterId = ""; 
    this.msgCount = 0;
    this.sessionKeyLastChanged = Date.now();
    this.roomIsEmptySince = Date.now();

}

Room.prototype.authenticate = function(credentials){

    if(this.roomId == credentials.roomId && this.roomPassword == credentials.roomPassword)
        return true;
    return false; 
};

Room.prototype.isEmpty = function(){
    return Object.keys(this.users).length == 0;
};

Room.prototype.updateSesssionKeyLastChanged = function(){
    this.sessionKeyLastChanged = Date.now();
};

Room.prototype.getNewMsgId = function(){
    return this.msgCount++;
};

Room.prototype.getUser = function(userId){
    return this.users[userId];
};

Room.prototype.deleteUser = function(userId){
    delete this.users[userId];
    //assign new master if the user is the master
    if(this.masterId == userId)
        this.assignNewMaster();
    
    //set isEmptyAt
    if(Object.keys(this.users).length == 0)
        this.roomIsEmptySince = Date.now();
    
};

Room.prototype.assignNewMaster = function(){
    if( Object.keys(this.users).length != 0 )
        this.masterId = Object.keys(this.users)[0];
    else
        this.masterId = "";
};

Room.prototype.addUser = function(userId, user){
    this.users[userId] = user;
};

Room.prototype.getMaster = function(){
    return this.users[ this.masterId ];
};

module.exports = Room;