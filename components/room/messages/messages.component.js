import React from "react";
import MessagesContainerComponent from "./messagesContainer/messagesContainer.component";
import MessageInputComponent from "./messageInput/messageInput.component";


import "./messages.component.css";

export default class MessagesComponent extends React.Component{

    constructor(){
        super();
    }

    render(){
        return (
            <div id="messages">
                <MessagesContainerComponent/>
                <MessageInputComponent/>
            </div>
        );
    }
}