import React from "react";
import globalContext from "../../globalContext";

import "./messagesContainer.component.css";


export default class MessagesContainerComponent extends React.Component{

    static contextType = globalContext;

    constructor(){
        super();
  
        this.state = { msgsContainer : [], pendingMsgsContainer : []};
    }

    render(){
        return(
            <div className={"messages-container"}>
                {
                    this.state.pendingMsgsContainer.concat(this.state.msgsContainer)
                    .map(msg=>{
                        return (
                            <div className="message" id={msg.id} key={msg.id}>
                                <h4 className="sender-name">{msg.sender}</h4>
                                <div className="content">{msg.content}</div>        
                            </div>)
                    })
                }
            </div>
        );
    }

    binarySearchMsgs(lastMsgId, start, end){
    
        if(start > end){
            return start;
        }
    
        const middle = Math.floor( (start + end) / 2 );
    
        if( this.state.msgsContainer[middle].id == lastMsgId)
            return middle;
        else if( this.state.msgsContainer[middle].id < lastMsgId)
            return this.binarySearchMsgs(lastMsgId, start, middle - 1);
        else
            return this.binarySearchMsgs(lastMsgId, middle+1, end);
        
    }



    componentDidMount(){
        
        this.socket = this.context.socket;
        this.securityClient = this.context.securityClient;
        this.orchestrator = this.context.orchestrator;


        this.orchestrator.on("USER_NAME", (userName)=>{
            this.userName = userName;
        });

        this.orchestrator.on("SYNC_MSGS", ()=>{
            const lastMsgId = (this.state.msgsContainer.length) ? 
                this.state.msgsContainer[0].id : 0
            
            //initiate msg synch
            this.socket.emit("SYNCHRONIZE_MSGS", lastMsgId);
        });

        this.orchestrator.on("PENDING_MSG", (msg, tempId)=>{
            this.setState((state)=>{
                state.pendingMsgsContainer.unshift({
                    id: tempId,
                    sender: this.context.userName,
                    content: msg
                });
                return state;
            });
        });
        
        //only if you're master
        this.socket.on("PREVIOUS_MSGS_REQUEST", (lastMsgId, userId)=>{
            
            const msgIndex = this.binarySearchMsgs(lastMsgId, 0, this.state.msgsContainer.length-1);
            const prevMsgs = this.state.msgsContainer.slice(0, msgIndex);
            
            //encrypting msgs
            prevMsgs.map((msg)=>{
                msg.content = this.securityClient.encryptMsg(msg.content);
                return msg;
            });

            this.socket.emit("PREVIOUS_MSGS", prevMsgs, userId);

        });

        this.socket.on("PREVIOUS_MSGS", (previousMsgsList)=>{

            //decrypt the msgs and insert into msgsContainer

            const decryptedMsgs = previousMsgsList.map((msg)=>{
                return {
                    id: msg.id,
                    sender: msg.sender,
                    content : this.securityClient.decryptMsg(msg.content)
                }
            });

            //place msgs into their container
            this.setState((state)=>{
                if(decryptedMsgs.length!=0){
                    let position =0;
                    while(position <state.msgsContainer.length && decryptedMsgs[0].id < state.msgsContainer[position].id)
                        position++;
                    
                    state.msgsContainer.splice(position, 0, ...decryptedMsgs);
                }
                return state;
            });

            //send pending msgs if they exist
            if(this.state.pendingMsgsContainer.length != 0){

                ////encrypt pending messages
                const encryptedMsgs = this.state.pendingMsgsContainer.map((msg)=>{
                    return this.securityClient.encryptMsg(msg);
                });

                //send encrypted msgs over socket
                this.socket.emit("PENDING_MSGS", encryptedMsgs);
            }

        });

        this.socket.on("MSG", (msg)=>{
            //insert the message in its place

            msg.content = this.securityClient.decryptMsg(msg.content);
            this.setState((state)=>{
                return {
                    msgsContainer : [msg , ...state.msgsContainer]
                }
            });
        });

        this.socket.on("MSG_ACK", (tempId, realId)=>{
            const msgIndex = this.state.pendingMsgsContainer.findIndex((pendingMsgObj, index)=>{
                if(tempId == pendingMsgObj.id)
                    return true;
                return false;
            });

            this.setState((state)=>{
                state.msgsContainer.unshift({
                    id: realId,
                    sender: this.context.userName,
                    content: state.pendingMsgsContainer[msgIndex].content
                });

                state.pendingMsgsContainer.splice(msgIndex, 1);
                return state;
            });
        });
    }

}