/**
 * @jest-environment jsdom
 */

import React, { createRef } from "react";
import { render, unmountComponentAtNode } from "react-dom";
import RoomComponent from "../components/app/room/room.component";
import { act } from "react-dom/test-utils";
import SecurityClient from "../utilities/securityClient";


jest.mock("socket.io-client", ()=>{
    const createFakeSocketIo =  require("./socket-clientFake");
    return createFakeSocketIo();
});

jest.mock("../components/app/room/header/header.component");
jest.mock("../components/app/room/connectedUsersList/connectedUsersList.component");
jest.mock("../components/app/room/messages/messages.component");


const container = document.createElement("div");
let roomComponent = null;


beforeAll((done)=>{

    done();
});

beforeEach((done)=>{
    document.body.appendChild(container);
    roomComponent = createRef();

    act(()=>{
        render(
            <RoomComponent.WrappedComponent ref={roomComponent}></RoomComponent.WrappedComponent>
        , container);
    });

    done();
});

afterEach((done) => {
    unmountComponentAtNode(container);
    done();
});

test("sending to server join request on connecting", ()=>{



    roomComponent.current.socket.sendToSocket("connect");

    expect(Object.keys(roomComponent.current.socket.emmitedEvents).length).toEqual(1);
    expect(Object.keys(roomComponent.current.socket.emmitedEvents)[0]).toEqual("JOIN_REQUEST");


});

test("sync msg event on firing sync connected users complete", ()=>{

    //fake a callback
    let callback = jest.fn();

    //attach orchestrator listener
    roomComponent.current.orchestrator.on("SYNC_MSGS", callback);

    //fire SYNC_CONNECTED_USERS_COMPLETE
    roomComponent.current.orchestrator.emit("SYNC_CONNECTED_USERS_COMPLETE");

    expect(callback).toHaveBeenCalledTimes(1); 

    unmountComponentAtNode(container);

});


test("state must change after sending METADATA", ()=>{

    roomComponent.current.socket.sendToSocket("META_DATA", "Project1", "amr", 3432);

    expect(roomComponent.current.state.roomName).toEqual("Project1");
    expect(roomComponent.current.state.userName).toEqual("amr");
    expect(roomComponent.current.state.userId).toEqual(3432);
});


test("sending a valid session key to the socket", ()=>{

    //send a connection event to socket
    roomComponent.current.socket.sendToSocket("connect");

    let master = new SecurityClient();

    master.generateKeyPair();
    master.generateSessionKey();
    const masterPK = master.exportPublicKey();
    
    const userPK = roomComponent.current.securityClient.exportPublicKey();

    const sessionKeyObj = master.exportSessionKey(userPK);

    //setting handler for orhcestrator
    let callback = jest.fn();
    roomComponent.current.orchestrator.on("SYNC_CONNECTED_USERS", callback);

        
    //sending the session key to socket
    roomComponent.current.socket.sendToSocket("SESSION_KEY", {
        encryptedKey: sessionKeyObj.encryptedKey,
        signature: sessionKeyObj.signature,
        masterPublicKey: masterPK
    });


    //expect the operation to succeed
    expect(Object.keys(roomComponent.current.socket.emmitedEvents)).toContain("KEY_SYNC_COMPLETE");

    //expect Orchestrator to get SYNC_CONNECTED_USERS
    expect(callback).toHaveBeenCalledTimes(1);
    

});

test("sending invalid session key to the socket", ()=>{
    //send a connection event to socket
    roomComponent.current.socket.sendToSocket("connect");

    let master = new SecurityClient();

    master.generateKeyPair();
    master.generateSessionKey();
    const masterPK = master.exportPublicKey();

    const userPK = roomComponent.current.securityClient.exportPublicKey();

    const sessionKeyObj = master.exportSessionKey(userPK);

    //setting handler for orhcestrator
    let callback = jest.fn();
    roomComponent.current.socket.on("connect", callback);

        
    //sending the session key to socket
    roomComponent.current.socket.sendToSocket("SESSION_KEY", {
        encryptedKey: sessionKeyObj.encryptedKey,
        signature: sessionKeyObj.signature + "garbage", //invalid signature
        masterPublicKey: masterPK
    });


    //expect Orchestrator to get SYNC_CONNECTED_USERS
    expect(callback).toHaveBeenCalledTimes(1);

});


test("sending NO_USERS_EXIST", ()=>{


    //preparing orchestrator callback
    let callback = jest.fn();
    roomComponent.current.orchestrator.on("SYNC_CONNECTED_USERS",callback);

    roomComponent.current.socket.sendToSocket("NO_USERS_EXIST");


    //expect to recieve KEY_SYNC_COMPLETE over socket
    expect(Object.keys(roomComponent.current.socket.emmitedEvents)).toContain("KEY_SYNC_COMPLETE");

    //testing the callback
    expect(callback).toHaveBeenCalledTimes(1);
    
});


test("sending SESSION_KEY_REQUEST", ()=>{

    //setup
    //  creating the user security client who is requesting the session key
    let userSecurityCLient = new SecurityClient();
    userSecurityCLient.generateKeyPair();
    let userPK = userSecurityCLient.exportPublicKey();

    //master socket must connect
    roomComponent.current.socket.sendToSocket("connect");

    //sending session key request to te socket
    roomComponent.current.socket.sendToSocket("SESSION_KEY_REQUEST", {
        userPublicKey: userPK,
        userId: 4345
    });

    //expect the socket to emit SESSION_KEY
    expect(Object.keys( roomComponent.current.socket.emmitedEvents )).toContain("SESSION_KEY");

    expect(roomComponent.current.socket.emmitedEvents["SESSION_KEY"][0].recieverId).toBe(4345);
    

});


test("changing session key in the middle of a session", ()=>{

    //setup
    // create user clients
    let securityClients = [ new SecurityClient(), new SecurityClient(), new SecurityClient()]
    
    //generate key pair foreach
    securityClients.forEach(client=>{
        client.generateKeyPair();
    });
    
    //create users list
    let users = [{
        id: 234,
        publicKey: securityClients[0].exportPublicKey()
    },
    {
        id: 734,
        publicKey: securityClients[1].exportPublicKey()
    },
    {
        id: 934,
        publicKey: securityClients[2].exportPublicKey()
    }];

    //master must connect first
    roomComponent.current.socket.sendToSocket("connect");

    //send event to socket
    roomComponent.current.socket.sendToSocket("CHANGE_SESSION_KEY", users);

    //expect a series of events
    expect( roomComponent.current.socket.emmitedEvents["NEW_SESSION_KEY"] ).not.toBe(undefined);

    //expect to find the last user data in the emmited events
    expect( roomComponent.current.socket.emmitedEvents["NEW_SESSION_KEY"][0] ).toBe(934);

    //expect CHANGE_SESSION_KEY_END to be emmited
    expect( Object.keys(roomComponent.current.socket.emmitedEvents) ).toContain("CHANGE_SESSION_KEY_END");

});

test("recieving NEW_SESSION_KEY", ()=>{
    //setup
    //user must connect first
    roomComponent.current.socket.sendToSocket("connect");

    // creating master client
    let masterClient = new SecurityClient(); 
    masterClient.generateKeyPair();
    masterClient.generateSessionKey();

    //fetching pk fo the user
    let userPk = roomComponent.current.securityClient.exportPublicKey();
    
    //exporting session key from master
    let sessionKeyObj= masterClient.exportSessionKey(userPk);

    //remove the connect event from socket
    delete roomComponent.current.socket.emmitedEvents["connect"];

    //send to socket the key
    roomComponent.current.socket.sendToSocket("NEW_SESSION_KEY",
            masterClient.exportPublicKey, sessionKeyObj.encryptedKey, sessionKeyObj.signature);
    
    //expect it to succeed , i.e. not to find "connect" in emmited events
    expect(Object.keys(roomComponent.current.socket.emmitedEvents)).not.toContain("connect");

});

