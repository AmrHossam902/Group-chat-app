

export default class Orchestrator{

    constructor(){
        this.callbacks = {}    
    }

    on(eventName, callback){
        
        if(!this.callbacks[eventName])
            this.callbacks[eventName] = [];
        
        this.callbacks[eventName].push(callback);      
    }

    emit(eventName, ...params){

        if(this.callbacks[eventName])
            this.callbacks[eventName].forEach(callback => {
                callback(...params);
            });
    }
} 