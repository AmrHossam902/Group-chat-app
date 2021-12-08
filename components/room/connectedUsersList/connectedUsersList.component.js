import React, { createRef } from "react";
import globalContext from "../globalContext";

import './connectedUsersList.component.css';


export default class ConnectedUsersListComponent extends React.Component {

    static contextType = globalContext;

    constructor(){
        super();
        this.listElement = createRef(); 
        this.state = { usersList: {}, visibility:"visible" };  
    }



    render(){
        const userIds = Object.keys(this.state.usersList);
        return(
            <aside className={this.state.visibility + " connected-list"} >
                <h4 className="title">Connected users</h4>
                {
                    userIds.map((id)=>{
                        return (
                            <div className="user-card" key={id} id={id}>
                                <h3 className="user-name">{this.state.usersList[id]}</h3>
                            </div>
                        );
                    })
                }  
            </aside> 
        );
    }


    componentDidMount(){

        this.socket = this.context.socket;
        this.orchestrator = this.context.orchestrator;

        this.orchestrator.on("SYNC_CONNECTED_USERS", ()=>{
            this.socket.emit("CONNECTED_USERS_REQUEST");
        });

        this.orchestrator.on("USERS_BTN_CLICK", ()=>{

            this.setState((state)=>{
                if(state.visibility == "visible")
                    state.visibility = "hidden";
                else
                    state.visibility = "visible";
                return state;
            });
                
        });


        this.socket.on("CONNECTED_USERS", (connectedUsers)=>{
            this.setState((state)=>{
                return {
                    usersList : connectedUsers
                }
            });
            this.orchestrator.emit("SYNC_CONNECTED_USERS_COMPLETE");
        });

        this.socket.on("USER_CONNECT", (userId, name)=>{
            //add user to the list
            this.setState((state)=>{
                state.usersList[userId] = name;
                return state;
            })
        });

        this.socket.on("USER_DISCONNECT", (userId)=>{
            //id of the user who disconnected
            this.setState( (state)=>{
                delete state.usersList[userId];
                return state;
            });

        });
    }
}