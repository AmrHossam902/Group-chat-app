import React, { createRef, Fragment } from "react";
import { render } from "react-dom";
import { io } from "socket.io-client";
import SecurityClient from "../../utilities/securityClient";
import Orchestrator from "../../utilities/orchestartor";


import globalContext from "./globalContext";
import MessagesComponent from "./messages/messages.component";
import ConnectedUsersListComponent from "./connectedUsersList/connectedUsersList.component";
import HeaderComponent from "./header/header.component";


import './room.component.css';



export default class RoomComponent extends React.Component{
    
    constructor(){
        super();

        this.securityClient = new SecurityClient();
        this.socket = io();
        this.isMaster = false;
        this.orchestrator = new Orchestrator();

        this.state = { userName: "", roomName: "loading..."}

    }

    render(){
        return (
        <Fragment>

            <globalContext.Provider value={
                {
                    socket: this.socket,
                    securityClient: this.securityClient,
                    orchestrator: this.orchestrator,
                    roomName: this.state.roomName,
                    userName: this.state.userName
                }
                }>
                <HeaderComponent/>
                <ConnectedUsersListComponent/>
                <MessagesComponent/>
            </globalContext.Provider>
        </Fragment>
        );
    }

    componentDidMount(){
        
        this.attachSocketHandlers();

        window.addEventListener("resize", ()=>{
            const withInRange = window.matchMedia("(min-width: 13cm)").matches;
            if(withInRange){
                document.getElementsByTagName("aside")[0].className = "visible";
            }
            else
            document.getElementsByTagName("aside")[0].className = "hidden";
        });

        this.orchestrator.on("SYNC_CONNECTED_USERS_COMPLETE", ()=>{
            this.orchestrator.emit("SYNC_MSGS");
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

        this.socket.on("META_DATA", (roomName, userName)=>{
            this.setState((state)=>{
                state.roomName = roomName;
                state.userName = userName;
                return state;
            });

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
            this.socket("SESSION_KEY", {
                encryptedKey : sessionKeyData.encryptedKey,
                signature : sessionKeyData.signature,
                recieverSocketId : data.userSocketId
            });
        })

        this.socket.on("YOU_ARE_MASTER", ()=>{
            //generate session key
            //loop over all hosts and emit SESSION_KEY to each enc (private + public)
        });
    }
}

render(<RoomComponent/>, document.getElementById("container"));