
import React, { createRef } from "react";
import { Link } from "react-router-dom";
import './createRoom.component.css';

export default class CreateRoomComponent extends React.Component{

    constructor(){
        super();
        this.credentialsBox = createRef();
        this.loader = createRef();
        this.errorBox = createRef();

    }

    showLoader(){
        this.loader.current.style.display = "block";
    }

    hideLoader(){
        this.loader.current.style.display = "none";
    }

    hideErrorBox(){
        this.errorBox.current.style.display = 'none';
    }
    raiseEmptyNameWarning(roomName){

        this.errorBox.current.innerHTML = "name can't be empty";
        this.errorBox.current.style.display = "block";
        roomName.focus();
        roomName.style.outlineColor = "red";
    }

    removeEmptyNameWarning(){
        document.forms["create-room-form"].roomName.style.outlineColor = "black";
        this.hideErrorBox();
    }

    raiseNetworkError(){
        this.errorBox.current.innerHTML = "connection error, try later";
        this.errorBox.current.style.display = "block";
    }

    removeNetworkError(){
        this.hideErrorBox();
    }

    showRoomCredentials(id, password){
        const dataHolder = this.credentialsBox.current.children[3];
        dataHolder.children[0].innerHTML = id;
        dataHolder.children[1].innerHTML = password;

        this.credentialsBox.current.style.display = "block";

    }

    sendCreateRoomRequest(roomNameElement){

        
        global.fetch = function(url, options){
            return new Promise(function(resolve, reject){
                setTimeout(()=>{
                    resolve({status: 201, json:function(){
                        return Promise.resolve({id:"aasdfghjkk", password: "1234asasf"});
                    }})
                }, 2000);
            });
        };
        

        this.showLoader();
        fetch("../rooms/new",{
            method: "POST",
            mode: "same-origin",
            headers: {
                "Content-Type" : "application/json"
            },
            body: {
                roomName: roomNameElement.value
            }
        })
        .then((response)=>{
            this.hideLoader();
            if(response.status == 201){
                response.json()
                .then(body=>{ this.showRoomCredentials(body.id, body.password); })
            }
            else{
                this.raiseNetworkError();
            }
        })
    }

    createBtnHandler(e){
        //prevent submitting
        e.preventDefault();
        const roomNameElement = document.forms["create-room-form"].elements.roomName;

        //validating name
        if(roomNameElement.value.length == 0){
            this.raiseEmptyNameWarning(roomNameElement);
        }
        else{
            this.sendCreateRoomRequest(roomNameElement);
        }
        console.log(roomNameElement.value);
    }

    
    render(){

        const hidden = {
            display: "none"
        }
        return(
        <div className="create-room wrapper">
            <form id="create-room-form" onSubmit={this.createBtnHandler.bind(this)}>
                <label>Create Room</label>
                <input name="roomName" 
                       type="text" 
                       placeholder="Room Name" 
                       onInput={()=>{ this.removeEmptyNameWarning(); }}></input>
                <button type="submit">Create</button>
                <div className="room-credentials" 
                     style={hidden} 
                     ref={this.credentialsBox}>
                    <h3>use these data to join</h3>
                    <span>
                        Room Id<br/> 
                        Room Password
                    </span>
                    <span>
                        &nbsp;&nbsp;:&nbsp;&nbsp;<br/>&nbsp;&nbsp;:&nbsp;&nbsp;
                    </span>
                    <span>
                        <label>ZByw34Hbdu</label><br/>
                        <label>da34b2vdh</label>
                    </span>
                </div>
                <div className="loader" style={hidden} ref={this.loader}>
                    <span className="spinner">
                    </span>
                    <label> creating Room...</label>
                </div>
                <label className="error" style={hidden} ref={this.errorBox}>couldn't connect</label>
            </form>
            <Link to="/join-room">Join Room?</Link>
        </div>
        );
    }


    componentWillUnmount(){

        //destroy data inside credentials holder
        const dataHolder = this.credentialsBox.current.children[3];
        dataHolder.children[0].innerHTML = "";
        dataHolder.children[1].innerHTML = "";

        this.credentialsBox.current.style.display = "none";
    }
}