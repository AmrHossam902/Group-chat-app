import React from "react"

import "./messagesContainer.component.css";


export default class MessagesContainerComponent extends React.Component{


    constructor(){
        super();
        this.state.msgsContainer = [];
    }


    /** 
     * @param {{sender:string, content:string}} msg msg Object
     */
    addMessage(msg){
        this.msgsContainer.push(msg);
    }

    getMsgRanges(){
        
    }

    render(){
        return(
            <div className="messages-container">
                {
                    this.state.msgsContainer.map(msg=>{
                        return (
                            <div className="message" id={msg.id}>
                                <h4 className="sender-name">{msg.sender}</h4>
                                <div className="content">{msg.content}</div>        
                            </div>)
                    })
                }
            </div>
        );
    }
}