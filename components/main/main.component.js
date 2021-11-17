
import React from "react";
import { render } from "react-dom";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './main.component.css';

import JoinRoomComponent from "./joinRoom/joinRoom.component";
import CreateRoomComponent from "./createRoom/createRoom.component";
import HomeComponent from "./home/home.component";



class MainComponent extends React.Component{


    render(){
        return (
            <BrowserRouter>
                <header>
                    <img alt="logo.png" src="./logo.png"/>
                    <label><b>Connect</b></label>
                </header>
                <Routes>
                    <Route path="/" element={<HomeComponent/>}></Route>
                    <Route path="/create-room" element={<CreateRoomComponent/>}></Route>
                    <Route path="/join-room" element={<JoinRoomComponent/>}></Route>
                </Routes>
                <footer> connect</footer>
            </BrowserRouter>
        )
    }
}


render(<MainComponent/>, document.body);
