import React, { createRef } from "react";
import { Link } from "react-router-dom";
import './joinRoom.component.css';


export default class JoinRoomComponent extends React.Component{


    constructor(){
        super();
        this.loader = createRef();
        this.errorBox = createRef();
        this.emptyFields = 2;
    }

    showLoader(){
        this.loader.current.style.display = "block";
    }

    hideLoader(){
        this.loader.current.style.display = "none";
    }

    showErrorBox(error){
        this.errorBox.current.style.display = "block";
        this.errorBox.current.innerHTML = error;
    }

    hideErrorBox(){
        this.errorBox.current.style.display = "none";
    }

    raiseEmptyFieldError(roomIdInput, roomPasswordInput, yourNameInput){

        this.emptyFields =0;

        if(roomIdInput.value.length == 0){
            roomIdInput.focus();
            roomIdInput.style.outlineColor = "red";
            roomIdInput.style.borderColor = "red";
            this.emptyFields++;
        }

        if(roomPasswordInput.value.length == 0){
            roomPasswordInput.focus();
            roomPasswordInput.style.outlineColor = "red";
            roomPasswordInput.style.borderColor = "red";
            this.emptyFields++;
        }

        if(yourNameInput.value.length == 0){
            yourNameInput.focus();
            yourNameInput.style.outlineColor = "red";
            yourNameInput.style.borderColor = "red";
            this.emptyFields++;
        }

        this.showErrorBox("fields can't be empty");
    }

    removeEmptyFieldError(e){

        if(e.target.style.borderColor == "red"){
            this.emptyFields--;
            e.target.style.outlineColor = "black";
            e.target.style.borderColor = "black";
        }        

        if(this.emptyFields == 0)
            this.hideErrorBox();
    }

    raiseIncorrectCredenialsError(){
        this.showErrorBox("Incorrect roomId or password !");
    }

    makeJoinRequest(roomIdValue, roomPasswordValue, yourNameValue){
        
        this.showLoader();
        fetch("../rooms/"+roomIdValue, {
            method: "POST",
            headers: {
                "Content-Type" : "application/json"
            },
            body: JSON.stringify({
                "roomId": roomIdValue,
                "roomPassword": roomPasswordValue,
                "yourName" :yourNameValue
            })
        })
        .then((response)=>{
            if(response.status == 200){
                location.pathname = "/rooms/"+roomIdValue;
            }
            else if(response.status == 404){
                //raise the error
                this.raiseIncorrectCredenialsError();
            }
            this.hideLoader();
        });
    }

    joinRoom(e){
        //prevent submission
        e.preventDefault();

        //validate both fields
        const roomIdInput = document.forms["join-room-form"].elements.roomId;
        const roomPasswordInput = document.forms["join-room-form"].elements.roomPassword;
        const yourNameInput = document.forms["join-room-form"].elements.yourName;

        if(roomIdInput.value.length == 0 || roomPasswordInput.value.length == 0 || yourNameInput.value.length == 0 ){
            this.raiseEmptyFieldError(roomIdInput, roomPasswordInput, yourNameInput);
        }
        else{
            //make api call here
            this.makeJoinRequest(roomIdInput.value, roomPasswordInput.value, yourNameInput.value);
        }
    }

    render(){

        const hidden = {
            display: "none"
        }

        return(
            <div className="join-room wrapper">
                <form id="join-room-form" onSubmit={this.joinRoom.bind(this)}>
                    <label>Join Room</label>
                    <input name="roomId" type="text" placeholder="Room Id" onInput={this.removeEmptyFieldError.bind(this)}></input>
                    <input name="roomPassword" type="password" placeholder="Room Password" onInput={this.removeEmptyFieldError.bind(this)}></input>
                    <input name="yourName" type="text" placeholder="Your Name" onInput={this.removeEmptyFieldError.bind(this)}></input>
                    <button type="submit">Join</button>
                    <div className="loader" ref={this.loader} style={hidden}>
                        <span className="spinner">
                        </span>
                        <label> Joining...</label>
                    </div>
                    <label className="error" ref={this.errorBox} style={hidden}></label>
                </form>

                <Link to="/create-room">Create Room?</Link>
            </div>
        );
    }

    componentWillUnmount(){
        document.forms["join-room-form"].roomId.value = "";
        document.forms["join-room-form"].roomPassword.value = "";
    }
}