import React, { createRef } from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { act } from "react-dom/test-utils";
import { io } from "socket.io-client";


import globalContext from "../components/room/globalContext";
import MessageInputComponent from "../components/room/messages/messageInput/messageInput.component";
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
    let res = unmountComponentAtNode(container);
    container = null;
    done();
});


test("testing btn click on non empty text field", ()=>{

    let inputComponent = createRef();
    act(()=>{
        render(<globalContext.Provider value={
            {
                socket: clientSocket,
                securityClient: securityClient,
                orchestrator: orchestartor,
                userName: "testUser"
            }
        }>
            <MessageInputComponent ref={inputComponent}></MessageInputComponent>
        </globalContext.Provider>, container);
    });

    //updating the text field
    act(()=>{
        document.getElementsByClassName("input-area")[0].innerHTML = "hello from cyprus";
    });

    //set the internal state of socket as connected
    clientSocket.connected = true;

    //set the orchestrator handler
    let mockFn = jest.fn();
    orchestartor.on("PENDING_MSG", mockFn);


    //dispatching event
    act(()=>{
        let sendBtn = document.getElementsByClassName("message-input")[0].lastElementChild.lastElementChild;
        sendBtn.dispatchEvent(new MouseEvent("click", {"bubbles": true}));
    });

    //expect new messge event
    expect(clientSocket.emmitedEvents["NEW_MSG"].length).toBe(2);

    //expect to recieve pending msg from orchestrator
    expect(mockFn.mock.calls.length).toBe(1);

}); 


test("testing btn click on empty text field", ()=>{

    let inputComponent = createRef();
    act(()=>{
        render(<globalContext.Provider value={
            {
                socket: clientSocket,
                securityClient: securityClient,
                orchestrator: orchestartor,
                userName: "testUser"
            }
        }>
            <MessageInputComponent ref={inputComponent}></MessageInputComponent>
        </globalContext.Provider>, container);
    });

    //set the internal state of socket as connected
    clientSocket.connected = true;

    //set the orchestrator handler
    let mockFn = jest.fn();
    orchestartor.on("PENDING_MSG", mockFn);


    //dispatching event
    act(()=>{
        let sendBtn = document.getElementsByClassName("message-input")[0].lastElementChild.lastElementChild;
        sendBtn.dispatchEvent(new MouseEvent("click", {"bubbles": true}));
    });

    //expect no messge event
    expect(clientSocket.emmitedEvents["NEW_MSG"]).toBe(undefined);

    //expect to recieve no pending msg from orchestrator
    expect(mockFn.mock.calls.length).toBe(0);

}); 

test("testing btn click on non empty text field and unconnected socket", ()=>{

    let inputComponent = createRef();
    act(()=>{
        render(<globalContext.Provider value={
            {
                socket: clientSocket,
                securityClient: securityClient,
                orchestrator: orchestartor,
                userName: "testUser"
            }
        }>
            <MessageInputComponent ref={inputComponent}></MessageInputComponent>
        </globalContext.Provider>, container);
    });

    //updating the text field
    act(()=>{
        document.getElementsByClassName("input-area")[0].innerHTML = "hello from cyprus";
    });
    

    //set the internal state of socket as connected
    clientSocket.connected = false;

    //set the orchestrator handler
    let mockFn = jest.fn();
    orchestartor.on("PENDING_MSG", mockFn);


    //dispatching event
    act(()=>{
        let sendBtn = document.getElementsByClassName("message-input")[0].lastElementChild.lastElementChild;
        sendBtn.dispatchEvent(new MouseEvent("click", {"bubbles": true}));
    });

    //expect no messge event
    expect(clientSocket.emmitedEvents["NEW_MSG"]).toBe(undefined);

    //expect to recieve a pending msg from orchestrator
    expect(mockFn.mock.calls.length).toBe(1);

}); 