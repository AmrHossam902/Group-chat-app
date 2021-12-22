
import React, { Suspense } from "react";
import { render } from "react-dom";
import { BrowserRouter, Route } from "react-router-dom";


import JoinRoomComponent from "./joinRoom/joinRoom.component";
import CreateRoomComponent from "./createRoom/createRoom.component";
import HomeComponent from "./home/home.component";
const RoomComponent = React.lazy(()=> import("./room/room.component"));


import './app.component.css';


class AppComponent extends React.Component{


    render(){
        return (
            <BrowserRouter>
                <Route exact path="/">
                    <HomeComponent/>
                </Route>
                <Route exact path="/create-room">
                    <CreateRoomComponent/>
                </Route>
                <Route exact path="/join-room">
                    <JoinRoomComponent/>
                </Route>
                <Route exact path="/rooms/:id">
                    <Suspense fallback={<h1>Joining ...</h1>}>
                        <RoomComponent/>
                    </Suspense>
                </Route>
            </BrowserRouter>
        )
    }
}


render(<AppComponent/>, document.getElementById("container"));
