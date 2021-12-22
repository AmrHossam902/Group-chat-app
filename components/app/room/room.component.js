import React from "react";
import { io } from "socket.io-client";

import SecurityClient from "../../../utilities/securityClient";
import Orchestrator from "../../../utilities/orchestartor";
import globalContext from "./globalContext";
import MessagesComponent from "./messages/messages.component";
import ConnectedUsersListComponent from "./connectedUsersList/connectedUsersList.component";
import HeaderComponent from "./header/header.component";


import './room.component.css';
import { withRouter } from "react-router";



class RoomComponent extends React.Component{
    
    constructor(props){
        super(props);

        this.securityClient = new SecurityClient();
        this.socket = io();
        this.isMaster = false;
        this.orchestrator = new Orchestrator();

        this.state = { 
            userName: "",
            userId: "",
            roomName: "loading..."
        }

    }

    render(){
        return (
            <globalContext.Provider value={
                {
                    socket: this.socket,
                    securityClient: this.securityClient,
                    orchestrator: this.orchestrator,
                    roomName: this.state.roomName,
                    userId: this.state.userId,
                    userName: this.state.userName
                }
                }>
                <HeaderComponent/>
                <ConnectedUsersListComponent/>
                <MessagesComponent/>
            </globalContext.Provider>
        );
    }

    componentDidMount(){
        
        this.attachSocketHandlers();

        window.addEventListener("resize", ()=>{
            const withInRange = window.matchMedia("(min-width: 13cm)").matches;
            if(withInRange){
                document.getElementsByTagName("aside")[0].style.zIndex = -1;
                document.getElementsByTagName("aside")[0].style.opacity =1;
            }
            else{
                document.getElementsByTagName("aside")[0].style.zIndex = -10;
                document.getElementsByTagName("aside")[0].style.opacity =0;
            }
        });

        this.orchestrator.on("SYNC_CONNECTED_USERS_COMPLETE", ()=>{
            this.orchestrator.emit("SYNC_MSGS");
        });

        window.addEventListener("popstate", () => {
            this.props.history.go(1);
        });
    }

    attachSocketHandlers(){
    
        this.socket.on("connect", ()=>{
            //generate your key pair once connected
            this.securityClient.generateKeyPair();
            //make a join request
            this.socket.emit("JOIN_REQUEST",{
                "publicKey" : this.securityClient.exportPublicKey()
            });
        });

        this.socket.on("META_DATA", (roomName, userName, userId)=>{
            this.setState((state)=>{
                state.roomName = roomName;
                state.userName = userName;
                state.userId = userId;
                return state;
            });

        });

        //emitted when getting session key
        this.socket.on("SESSION_KEY", (data)=>{
            const succeeded = this.securityClient.importSessionKey(data.encryptedKey, data.signature, data.masterPublicKey);

            if(succeeded){
                this.socket.emit("KEY_SYNC_COMPLETE");
                this.orchestrator.emit("SYNC_CONNECTED_USERS");
            }
                
            else{
                console.log("invalid session key");
                this.socket.connect();
            }
                
        });

        this.socket.on("NO_USERS_EXIST", ()=>{
            //you 're master
            this.isMaster = true;
            //generate session key
            this.securityClient.generateSessionKey();
            this.socket.emit("KEY_SYNC_COMPLETE");
            this.orchestrator.emit("SYNC_CONNECTED_USERS");
        });


        /**     general events */

        //emitted when you're the master and there is a new commer
        this.socket.on("SESSION_KEY_REQUEST", (data)=>{
            //encrypt session key (private + public)
            /**
             *  JSONStringSessionKey =  stringify(sessionkey)
             *  signature = sign ( hash( JSONStringSessionKey ) )
             *  encKey = enc with user's Public( JSONStringSessionKey )
             *  stringify ( { "encKey": encKey , "signature": signature })
             */


            const sessionKeyData = this.securityClient.exportSessionKey(data.userPublicKey);
            // emit SESSION_KEY
            this.socket.emit("SESSION_KEY", {
                encryptedKey : sessionKeyData.encryptedKey,
                signature : sessionKeyData.signature,
                recieverId : data.userId
            });
        })

        this.socket.on("YOU_ARE_MASTER", ()=>{
            //generate session key
            //loop over all hosts and emit SESSION_KEY to each enc (private + public)
        });
    }
}

export default withRouter(RoomComponent);