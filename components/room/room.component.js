import React, { Fragment } from "react";
import { render } from "react-dom";
import './room.component.css';


export default class RoomComponent extends React.Component{
    
    render(){
        return (
            <Fragment>
                <header>
                    <h3 className="group-name"> GROUP NAME</h3>
                </header>
                <aside>
                    <h4 className="online-users">Connected users</h4>
                    <div className="user-card">
                        <h3 className="user-name">Amr Hossam Sayed</h3> 
                    </div>
                    <div className="user-card">
                        <h3 className="user-name">Amr Hossam Sayed</h3> 
                    </div>
                    <div className="user-card">
                        <h3 className="user-name">Amr Hossam Sayed</h3> 
                    </div>
                    <div className="user-card">
                        <h3 className="user-name">Amr Hossam Sayed</h3> 
                    </div>
                    <div className="user-card">
                        <h3 className="user-name">Amr Hossam Sayed</h3> 
                    </div>
                    <div className="user-card">
                        <h3 className="user-name">Amr Hossam Sayed</h3> 
                    </div>
                    <div className="user-card">
                        <h3 className="user-name">Amr Hossam Sayed</h3> 
                    </div>
                    <div className="user-card">
                        <h3 className="user-name">Amr Hossam Sayed</h3> 
                    </div>
                    <div className="user-card">
                        <h3 className="user-name">Amr Hossam Sayed</h3> 
                    </div>
                    
                </aside>
                <div className="messaging-field">
                    <div className="message">
                        <h4 className="sender-name">sender name</h4>
                        <div className="content">hello cousin</div>
                    </div>
                    <div className="message">
                        <h4 className="sender-name">sender name</h4>
                        <div className="content">hello dude</div>
                    </div>

                    <div className="message">
                        <h4 className="sender-name">sender name</h4>
                        <div className="content">good morning lads we are going to make a massive treating goal at the final</div>
                    </div>
                    
                </div>
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
}

render(<RoomComponent/>, document.body);