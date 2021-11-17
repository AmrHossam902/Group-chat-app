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

    raiseEmptyFieldError(roomIdInput, roomPasswordInput){

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

    makeJoinRequest(roomIdValue, roomPasswordValue){
        
             
        global.fetch = function(url, options){
            return new Promise(function(resolve, reject){
                setTimeout(()=>{
                    resolve({status: 200, json:function(){
                        return Promise.resolve();
                    }})
                }, 2000);
            });
        };
        


        this.showLoader();
        fetch("../rooms/"+roomIdValue, {
            method: "POST",
            body: {
                roomPassword: roomPasswordValue
            }
        })
        .then((response)=>{
            if(response.status == 200){
                location.pathname = "/rooms/"+roomIdValue;
            }
        });
    }

    joinRoom(e){
        //prevent submission
        e.preventDefault();

        //validate both fields
        const roomIdInput = document.forms["join-room-form"].elements.roomId;
        const roomPasswordInput = document.forms["join-room-form"].elements.roomPassword;


        if(roomIdInput.value.length == 0 || roomPasswordInput.value.length == 0){
            this.raiseEmptyFieldError(roomIdInput, roomPasswordInput);
        }
        else{
            //make api call here
            this.makeJoinRequest(roomIdInput.value, roomPasswordInput.value);
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