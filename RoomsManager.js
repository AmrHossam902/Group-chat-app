
const { rooms, joinRequests} = require("./roomsData");

function createRoomsManager(rooms, joinRequests){

    return {
        roomExists: function(roomId){
            return rooms[roomId]? true: false;
        },

        deleteRoom: function(roomId){
            delete rooms[roomId];
        },

        addRoom: function(room){
            rooms[room.roomId] = room;
        },

        getRoom: function(roomId){
            return rooms[roomId];
        },

        registerJoinRequest: function(userId, userData){
            joinRequests[userId] = {
                socketId: userData.socketId,
                roomId: userData.roomId,
                userName: userData.userName,
                publicKey: userData.publicKey
            }
        },

        getJoinRequest: function(userId){
            return joinRequests[userId];
        },

        moveJoinReqToRoom: function(roomId, userId){
            rooms[roomId].addUser(userId, joinRequests[ userId ]);
            delete joinRequests[ userId ];
        },

        exectutePerRoom: function(fn){
            for (const roomId in rooms) {
                fn(roomId);
            }
        }

    }
};

module.exports = createRoomsManager(rooms, joinRequests);
