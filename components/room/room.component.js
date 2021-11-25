import React, { createRef, Fragment } from "react";
import { render } from "react-dom";
import { io } from "socket.io-client";
import forge from "node-forge";


import ConnectedUsersListComponent from "./connectedUsersList/connectedUsersList.component";

import './room.component.css';


export default class RoomComponent extends React.Component{
    
    /**
     * @type {forge.pki.rsa.PublicKey}
     */
    publicKey = null;
    /**
     * @type {forge.pki.rsa.PrivateKey}
     */
    privateKey = null;
    sessionKey = null;
    isMaster = false;
    connectedUsersComponent = null;
    messagesContainerComponent = null;

    constructor(){
        super();
        this.connectedUsersComponent =createRef();
        this.messagesContainerComponent = createRef();
    }

    render(){
        return (
            <Fragment>
                <header>
                    <h3 className="group-name"> GROUP NAME</h3>
                </header>
                <ConnectedUsersListComponent ref={this.connectedUsersComponent}/>
                <MessagesContainerComponent ref={this.messagesContainerComponent}/>
                <div className="message-input-container">
                    <span >
                        <div className="input-area" contentEditable="true">
                        </div>
                    </span>
                    <span>
                        <button><img src="/send-btn.png"/></button>
                    </span>
            
                </div>
            </Fragment>
        );
    }

    componentDidMount(){
        this.socket = io();
        this.attachSocketHandlers();
    }


    generateKeyPair(){
        const keyPair = forge.pki.rsa.generateKeyPair(1024);
        this.publicKey = keyPair.publicKey;
        this.privateKey = keyPair.privateKey;
    }

    generateSessionKey(){
        // AES-cbc key (2 parts main key = initialization vector, of same length ) 
        this.sessionKey = {};
        this.sessionKey.key = forge.random.getBytesSync(16);
        this.sessionKey.iv = forge.random.getBytesSync(16);
    }



    /**
     * 
     * @param {string} encryptedKey 
     * @param {forge.pki.PEM} masterPublicKey 
     */
    extractSessionKey( sessionKeyMsg, masterPublicKey){
        const plainKey = this.privateKey.decrypt(sessionKeyMsg.encryptedKey);
        const masterPublicInPem = forge.pki.publicKeyFromPem(masterPublicKey);
        const isValid = masterPublicInPem.verify(forge.md.sha256.create().update(plainKey).digest().bytes(), sessionKeyMsg.signature);

        if(isValid){
            this.sessionKey = plainKey;
            return true;
        }
        else{
            console.log("key is invalid");
            return false;
        }
            
    }

    attachSocketHandlers(){

        this.socket.on("connect", ()=>{
            //send ASK_FOR_SESSION_KEY
            this.socket.emit("ASK_FOR_SESSION_KEY");
        });
        

        //emitted when getting session key
        this.socket.on("SESSION_KEY", (sessionKeyMsg)=>{
            const succeeded = this.extractSessionKey(sessionKeyMsg);

            if(succeeded)
                this.socket.emit("KEY_SYNC_COMPLETE");
            else
                this.socket.connect();
        });

        this.socket.on("NO_USERS_EXIST", ()=>{
            //you 're master
            this.isMaster = true;
            //generate session key
            this.generateSessionKey();
            this.socket.emit("KEY_SYNC_COMPLETE");
        });

        this.socket.on("KEY_SYNC_COMPLETE", ()=>{
            //initiate msg synch
            this.socket.emit("SYNCHRONIZE_MSGS");
        });

        /**          MSG SYNC SCHEME to go here */
        // meta data are msgs ranges on the server and the total msg count
        this.socket.on("ROOM_MSGS_META_DATA", (data)=>{
            //get the msg ranges you lack
            //get the msg ranges that server lacks and you own
            //then do this concurently ask the server for needed ranges
            //and send those msgs that the server lacks
        });


        /**     general events */

        //emitted when you're the master and there is a new commer
        this.socket.on("ASK_FOR_SESSION_KEY", ()=>{
            //encrypt session key (private + public)
            // emit SESSION_KEY
        })

        this.socket.on("YOU_ARE_MASTER", ()=>{
            //generate session key
            //loop over all hosts and emit SESSION_KEY to each enc (private + public)
        });


        this.socket.on("USER_CONNECT", (user)=>{
            //add user to the list
        })

        this.socket.on("MSG_RECIEVED", (msg)=>{
            //insert the message in its place
        })




        this.socket.on("GROUP_NAME", (data)=>{
            document.getElementsByClassName("group-name")[0].innerHTML = data;
        });


        

    }
}

render(<RoomComponent/>, document.body);