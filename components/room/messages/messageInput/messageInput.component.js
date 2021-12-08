import React, { createRef } from "react";
import globalContext from "../../globalContext";
import "./messageInput.component.css";


export default class MessageInputComponent extends React.Component{

    static contextType = globalContext;

    constructor(){
        super();

        this.inputArea = createRef();
    }

    sendBtnOnClick(){
        
        const msg = this.inputArea.current.innerHTML;
        
        if(msg.length == 0)
            return;
        
        const encryptedMsg = this.securityClient.encryptMsg(msg);

        const tempId = (Math.random()*10e10).toString().substr(0,10);
        //send only if socket is open
        if(this.socket.connected)
            this.socket.emit("NEW_MSG", encryptedMsg, tempId);
        
        //store msg as pending utill acked
        this.orchestrator.emit("PENDING_MSG", msg, tempId);
    }

    render(){
        return (                
            <div className="message-input">
                <span >
                    <div className="input-area" contentEditable="true" ref={this.inputArea}>
                    </div>
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
        
    }
}