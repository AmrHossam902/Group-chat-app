import React, { createRef } from "react";
import globalContext from "../../globalContext";
import "./messageInput.component.css";


export default class MessageInputComponent extends React.Component{

    static contextType = globalContext;

    constructor(){
        super();
        this.inputArea = createRef();
        this.msgsAreLocked = false;
    }

    sendBtnOnClick(){
        
        let msg = this.inputArea.current.value;
        
        
        if(msg.length == 0)
            return;
        
        const encryptedMsg = this.securityClient.encryptMsg(msg);

        const tempId = (Math.random()*10e10).toString().substr(0,10);
        //send only if socket is open
        console.log("socket status :" + this.socket.connected)
        console.log("msgsAreLocked :" + this.msgsAreLocked);

        if(this.socket.connected && !this.msgsAreLocked)
            this.socket.emit("NEW_MSG", encryptedMsg, tempId);
        
        //store msg as pending utill acked
        this.orchestrator.emit("PENDING_MSG", msg, tempId);

        //clear text area
        this.inputArea.current.value = '';
    }

    onInputChange(e){
    
        e.target.style.height = 0;
        e.target.style.height = e.target.scrollHeight + "px";
    }

    render(){
        return (                
            <div className="message-input">
                <span >
                    <textarea onChange={this.onInputChange.bind(this)} className="input-area" ref={this.inputArea}>
                    </textarea>
                </span>
                <span>
                    <button onClick={this.sendBtnOnClick.bind(this)}><img src="/send-btn.png"/></button>
                </span>
            </div>
        );
    }

    componentDidMount(){

        this.socket = this.context.socket;
        this.orchestrator = this.context.orchestrator;
        this.securityClient = this.context.securityClient;

        this.socket.on("LOCK_MSGS", ()=>{
            this.msgsAreLocked = true;
        });

        this.socket.on("UNLOCK_MSGS", ()=>{
            this.msgsAreLocked = false;
            console.log("UNLOCK_MSGS emitted");
        });
    }
}