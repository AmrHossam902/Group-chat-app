
module.exports=  function createSocketIoFake(){
    return {
        io: function(){

            var socketObj = {
                callbacks: {},
                emmitedEvents: {},
                emit: function(event, ...args){
                    this.emmitedEvents[event] = args;
                },
                on: function(event, callback){
                    if(!this.callbacks[event])
                        this.callbacks[event] = [];
                    this.callbacks[event].push(callback);
                },
                connect: function(){
                    this.sendToSocket("connect");
                },
                sendToSocket: function(event, ...data){   
                    if(this.callbacks[event])
                    this.callbacks[event].forEach(fn => {
                        fn(...data);
                    });
                },
                resetClient: function(){
                    this.callbacks = {};
                    this.emmitedEvents= {};
                }
            }

            return socketObj;
        }
    }
};