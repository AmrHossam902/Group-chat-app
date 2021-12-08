import React from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { act } from "react-dom/test-utils";
import { io } from "socket.io-client";


import globalContext from "../components/room/globalContext";
import ConnectedUsersListComponent from "../components/room/connectedUsersList/connectedUsersList.component";
import Orchestractor from "../utilities/orchestartor";



let clientSocket = null;
let orchestartor = null;
let container =  null;

jest.mock("socket.io-client", ()=>{
    const createFakeSocketIo =  require("./socket-clientFake");
    return createFakeSocketIo();
});


beforeAll((done)=>{
    clientSocket = io();
    done();
});


beforeEach((done)=>{
    orchestartor = new Orchestractor();
    container = document.createElement("div");
    document.body.appendChild(container);
    done();
});

afterEach((done) => {
    // cleanup on exiting
    clientSocket.resetClient();
    unmountComponentAtNode(container);
    container = null;
    done();
  });


test("rendering empty list", ()=>{

    act(()=>{
        render(<globalContext.Provider value={
            {
                socket: clientSocket,
                orchestrator: orchestartor
            }
        }>
                <ConnectedUsersListComponent/>
            </globalContext.Provider>
        , container);
    });

    
    expect(document.getElementsByTagName("aside")[0].firstElementChild.className).toBe("title");
 

});

 
test("rendering list with 2 users", ()=>{


    act(()=>{
        render(<globalContext.Provider value={
            {
                socket: clientSocket,
                orchestrator: orchestartor
            }
        }>
                <ConnectedUsersListComponent/>
            </globalContext.Provider>
        , container);
    });

    clientSocket.sendToSocket("CONNECTED_USERS", { "1": "ali", "2": "karim"});
    
    expect(document.getElementsByTagName("aside")[0].querySelectorAll("div.user-card").length).toBe(2);
});



test("suddenly a user connects", ()=>{
    
    
    
    act(()=>{
        render(<globalContext.Provider value={
            {
                socket: clientSocket,
                orchestrator: orchestartor
            }
        }>
                <ConnectedUsersListComponent/>
            </globalContext.Provider>
        , container);
    });
    // taking a snapshot of users count before connecting
    const usersCount = document.getElementsByTagName("aside")[0].querySelectorAll("div.user-card").length;

    //firing connection event
    clientSocket.sendToSocket("USER_CONNECT", "12345", "adel");
    
    //expect that users increase by one
    expect(document.getElementsByTagName("aside")[0].querySelectorAll("div.user-card").length).toBe(usersCount+ 1);

    //expect the last one to be the most recently connected
    expect(document.querySelector("aside").lastChild.id).toBe("12345");
    expect(document.querySelector("aside").lastChild.lastChild.innerHTML).toBe("adel");

   
});


test("suddenly a user disconnects", ()=>{


    act(()=>{
        render(<globalContext.Provider value={
            {
                socket: clientSocket,
                orchestrator: orchestartor
            }
        }>
                <ConnectedUsersListComponent/>
            </globalContext.Provider>
        , container);
    });

    clientSocket.sendToSocket("CONNECTED_USERS", { "1": "ali", "2": "karim", "3": "salem"});

    // taking a snapshot of users count before connecting
    const usersCount = document.getElementsByTagName("aside")[0].querySelectorAll("div.user-card").length;

    //firing disconnection event
    clientSocket.sendToSocket("USER_DISCONNECT", "2");

    //users count must have decreased
    expect(document.getElementsByTagName("aside")[0].querySelectorAll("div.user-card").length).toBe(usersCount -1);
    
    //user #2 must have gone
    expect(document.querySelector("aside").querySelector("div[id='2']")).toBe(null);

});


test("recieving SYNC_CONNECTED_USERS signal to start syncing users", ()=>{

    act(()=>{
        render(<globalContext.Provider value={
            {
                socket: clientSocket,
                orchestrator: orchestartor
            }
        }>
                <ConnectedUsersListComponent/>
            </globalContext.Provider>
        , container);
    });

    //firing sync users
    orchestartor.emit("SYNC_CONNECTED_USERS");

    //expect socket to recieve CONNECTED_USERS_REQUEST
    expect(clientSocket.emmitedEvents["CONNECTED_USERS_REQUEST"]).toEqual([]); 


}); 


test("recieving user btn click", ()=>{

    let usersList = React.createRef();

    act(()=>{
        render(<globalContext.Provider value={
            {
                socket: clientSocket,
                orchestrator: orchestartor
            }
        }>
                <ConnectedUsersListComponent ref={usersList}/>
            </globalContext.Provider>
        , container);
    });


    //expect list to be visible
    expect(usersList.current.state.visibility).toBe("visible"); 

    //firing user btn click
    orchestartor.emit("USERS_BTN_CLICK");

    //expect list to be hidden
    expect(usersList.current.state.visibility).toBe("hidden"); 

    //firing user btn click again
    orchestartor.emit("USERS_BTN_CLICK");

    //expect list to be visible
    expect(usersList.current.state.visibility).toBe("visible"); 



});