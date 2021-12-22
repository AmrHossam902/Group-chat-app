import React from "react";
import globalContext from "../globalContext";

import "./header.component.css";

export default class HeaderComponent extends React.Component{

    static contextType = globalContext;

    constructor(){
        super();

        this.state = { online: false }
    }

    usersBtnClicked(){
        this.orchestrator.emit("USERS_BTN_CLICK");
    }


    render(){
        return(
            <header className="msg-page-header">
                <span>
                    <h3 className="group-name">{this.context.roomName}</h3>
                </span>
                <span className="connection-status" style={{backgroundColor: this.state.online? "rgb(2, 185, 2)": "red"}}>
                </span>
                <button id="show-users-btn" onClick={this.usersBtnClicked.bind(this)}>
                    <img src="/users.png"></img>
                </button>
            </header>
        );
    }

    componentDidMount(){

        this.orchestrator = this.context.orchestrator;
        this.socket = this.context.socket;


        //adding hooks 
        this.socket.on("connect", ()=>{
            this.setState((state)=>{
                state.online = true;
                return state;
            });
        });

        this.socket.on("disconnect", ()=>{
            this.setState((state)=>{
                state.online = false;
                return state;
            });
        });

    }


}