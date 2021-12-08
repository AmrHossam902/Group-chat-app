
module.exports=  function createSocketIoFake(){
    return {
        io: function(){
            return {
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
                sendToSocket: function(event, ...data){   
                    this.callbacks[event].forEach(fn => {
                        fn(...data);
                    });
                },
                resetClient: function(){
                    this.callbacks = {};
                    this.emmitedEvents= {};
                }
            }
        }
    }
};