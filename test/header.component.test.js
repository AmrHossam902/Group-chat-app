import React, { createRef } from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { act } from "react-dom/test-utils";
import { io } from "socket.io-client";


import globalContext from "../components/room/globalContext";
import HeaderComponent from "../components/room/header/header.component";
import Orchestrator from "../utilities/orchestartor";
import SecurityClient from "../utilities/securityClient";



let clientSocket = null;
let securityClient = null;
let orchestartor = null;
let container =  null;

jest.mock("socket.io-client", ()=>{
    const createFakeSocketIo =  require("./socket-clientFake");
    return createFakeSocketIo();
});


beforeAll((done)=>{
    clientSocket = io();
    securityClient = new SecurityClient();
    
    //initialize securityCLient
    securityClient.generateKeyPair();
    securityClient.generateSessionKey();

    done();
});

beforeEach((done)=>{
    orchestartor = new Orchestrator();
    container = document.createElement("div");
    document.body.appendChild(container);
    done();
});

afterEach((done) => {
    // cleanup on exiting
    orchestartor = null;
    clientSocket.resetClient();
    unmountComponentAtNode(container);
    container = null;
    done();
});

test("intial rendering", ()=>{
    act(()=>{
        render(<globalContext.Provider value={
            {
                socket: clientSocket,
                orchestrator: orchestartor,
                roomName: "testRoom"
            }
        }>
            <HeaderComponent></HeaderComponent>
        </globalContext.Provider>, container);
    });


    expect(document.getElementsByTagName("header")[0].childElementCount).toBe(3); 

    //expecting room name
    expect(document.getElementsByTagName("header")[0].firstElementChild.firstElementChild.innerHTML).toEqual("testRoom");
});


test("testing btn functionality", ()=>{
    act(()=>{
        render(<globalContext.Provider value={
            {
                socket: clientSocket,
                orchestrator: orchestartor
            }
        }>
            <HeaderComponent></HeaderComponent>
        </globalContext.Provider>, container);
    });

    //preparing callbak
    let btnOnClick = jest.fn();
    orchestartor.on("USERS_BTN_CLICK", btnOnClick);

    //dispatching click event
    document.getElementById("show-users-btn").dispatchEvent(new MouseEvent("click",{bubbles: true}));


    //btnOnclick must have been called once
    expect(btnOnClick.mock.calls.length).toBe(1); 
}); 


test("sending socket connection events", ()=>{
    const headerCommponent = createRef();

    act(()=>{
        render(<globalContext.Provider value={
            {
                socket: clientSocket,
                orchestrator: orchestartor
            }
        }>
            <HeaderComponent ref={headerCommponent}></HeaderComponent>
        </globalContext.Provider>, container);
    });

    //expect state to be offline
    expect(headerCommponent.current.state.online).toBe(false); 

    clientSocket.sendToSocket("connect");

    //expect state to change to online
    expect(headerCommponent.current.state.online).toBe(true); 

    //sending disconnect event
    clientSocket.sendToSocket("disconnect");

    //expect state to be offline
    expect(headerCommponent.current.state.online).toBe(false); 

});
