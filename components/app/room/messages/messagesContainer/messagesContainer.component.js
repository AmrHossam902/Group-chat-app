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
                            <div className={"message "+ ((this.context.userId==msg.userId)?"mine":"")} id={msg.id} key={msg.id}>
                                <h4 className="sender-name">{msg.userName}</h4>
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


        this.orchestrator.on("SYNC_MSGS", ()=>{
            const lastMsgId = (this.state.msgsContainer.length) ? 
                this.state.msgsContainer[0].id : -1;
            
            //initiate msg synch
            this.socket.emit("SYNCHRONIZE_MSGS", lastMsgId);
        });

        this.orchestrator.on("PENDING_MSG", (msg, tempId)=>{
            console.log("-------Pendeing msg----------");
            console.log("   content: "+ msg);
            console.log("    tempId: " + tempId );
            console.log("-------Pendeing msg end----------");
            
            this.setState((state)=>{
                state.pendingMsgsContainer.unshift({
                    id: tempId,
                    userId: this.context.userId,
                    userName: this.context.userName,
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
            const encryptedPrevMsgs = prevMsgs.map((msg)=>{
                return {
                    id: msg.id,
                    userId: userId,
                    userName: msg.userName,
                    content: this.securityClient.encryptMsg(msg.content)
                };
            });

            this.socket.emit("PREVIOUS_MSGS", encryptedPrevMsgs, userId);

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

            console.log("--------- MSG -----------");
            console.log("   msgId: " + msg.id);
            console.log("  sender: " + msg.sender);
            console.log("  EncMsg: " + msg.content);
            console.log("-------MSG end ----------");
            //insert the message in its place

            msg.content = this.securityClient.decryptMsg(msg.content);

            this.setState((state)=>{

                state.msgsContainer.unshift(msg);
                return state;
            });
        });

        this.socket.on("MSG_ACK", (tempId, realId)=>{

            console.log("--------- MSG ACK -----------");
            console.log("   tempId: " + tempId);
            console.log("   realId: " + realId);
            console.log("-------- MSG ACK end ----------");

            const msgIndex = this.state.pendingMsgsContainer.findIndex((pendingMsgObj)=>{
                if(tempId == pendingMsgObj.id)
                    return true;
                return false;
            });

            this.setState((state)=>{
                state.msgsContainer.unshift({
                    id: realId,
                    userId: this.context.userId,
                    userName: this.context.userName,
                    content: state.pendingMsgsContainer[msgIndex].content
                });

                state.pendingMsgsContainer.splice(msgIndex, 1);
                return state;
            });
        });
    }

}