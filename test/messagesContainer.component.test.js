import React, { createRef } from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { act } from "react-dom/test-utils";
import { io } from "socket.io-client";


import globalContext from "../components/app/room/globalContext";
import MessagesContainerComponent from "../components/app/room/messages/messagesContainer/messagesContainer.component";
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


test("initial rendering ", ()=>{

    act(()=>{
        render(<globalContext.Provider value={{
            socket: clientSocket,
            securityClient: securityClient,
            orchestrator: orchestartor,
            roomName: "testRoom",
            userName: "testUser"
        }}>
            <MessagesContainerComponent/>
        </globalContext.Provider>, container);
    });

    expect(document.getElementsByClassName("messages-container").length).toEqual(1);

    //expect to find no messages
    expect(document.getElementsByClassName("messages-container")[0].children.length).toEqual(0)
}); 

test("sending SYNC_MSG to an empty component",()=>{
    const messgesContainer = createRef();

    act(()=>{
        render(<globalContext.Provider value={{
            socket: clientSocket,
            securityClient: securityClient,
            orchestrator: orchestartor,
            roomName: "testRoom",
            userName: "testUser"
        }}>
            <MessagesContainerComponent ref={messgesContainer}/>
        </globalContext.Provider>, container);
    });
    
    orchestartor.emit("SYNC_MSGS");

    //expect to find only the emitted event
    expect(Object.keys(clientSocket.emmitedEvents["SYNCHRONIZE_MSGS"]).length).toEqual(1);
    expect(clientSocket.emmitedEvents["SYNCHRONIZE_MSGS"]).not.toBe(undefined);

    //expect that argument lastId =0
    expect(clientSocket.emmitedEvents["SYNCHRONIZE_MSGS"]).toEqual([-1]);
    
});

test("sending SYNC_MSG to non empty component",()=>{
    const messgesContainer = createRef();

    act(()=>{
        render(<globalContext.Provider value={{
            socket: clientSocket,
            securityClient: securityClient,
            orchestrator: orchestartor,
            roomName: "testRoom",
            userName: "testUser"
        }}>
            <MessagesContainerComponent ref={messgesContainer}/>
        </globalContext.Provider>, container);
    });

    act(()=>{
        messgesContainer.current.setState((state)=>{
            state.msgsContainer.unshift({
                id:3,
                userId: 23423,
                userName: "yassin",
                content: "hi"
            },{
                id:2,
                userId: 234234,
                userName: "ali",
                content: "hi"      
            },{
                id:1,
                userId: 546456,
                userName: "yassin",
                content: "what do we have for today"
            });
            return state;
        }); 
    });
    
    orchestartor.emit("SYNC_MSGS");

    //expect to find only the emitted event
    expect(Object.keys(clientSocket.emmitedEvents["SYNCHRONIZE_MSGS"]).length).toEqual(1);
    expect(clientSocket.emmitedEvents["SYNCHRONIZE_MSGS"]).not.toBe(undefined);

    //expect that argument lastId =0
    expect(clientSocket.emmitedEvents["SYNCHRONIZE_MSGS"]).toContain(3);
    
});

test("sending a Pending msg to the component", ()=>{
    const messgesContainer = createRef();

    act(()=>{
        render(<globalContext.Provider value={{
            socket: clientSocket,
            securityClient: securityClient,
            orchestrator: orchestartor,
            roomName: "testRoom",
            userName: "testUser",
            userId: 342
        }}>
            <MessagesContainerComponent ref={messgesContainer}/>
        </globalContext.Provider>, container);
    });

    act(()=>{
        orchestartor.emit("PENDING_MSG", "hello from east", 4123124314 );
    });

    //data should go into pending message container
    expect(messgesContainer.current.state.pendingMsgsContainer).toEqual([{
        id: 4123124314,
        userId:342,
        userName: "testUser",
        content: "hello from east"
    }]);

    //nothing to go into msgsCOntainer
    expect(messgesContainer.current.state.msgsContainer.length).toEqual(0);

    //expect the dom to contain 1 msg
    expect(document.getElementsByClassName("messages-container")[0].children.length).toBe(1);

});

test("sending a Pending msg to the component while having non empty msg container", ()=>{
    const messgesContainer = createRef();

    act(()=>{
        render(<globalContext.Provider value={{
            socket: clientSocket,
            securityClient: securityClient,
            orchestrator: orchestartor,
            roomName: "testRoom",
            userName: "testUser",
            userId: 342
        }}>
            <MessagesContainerComponent ref={messgesContainer}/>
        </globalContext.Provider>, container);
    });

    act(()=>{
        messgesContainer.current.setState((state)=>{
            state.msgsContainer.unshift({
                id: 12,
                userId: 421,
                userName: "amr",
                content: "hello"
            },{
                id: 11,
                userId: 543,
                userName: "ayman",
                content: "hello lads"   
            },{
                id: 10,
                userId: 654,
                userName: "ali",
                content: "greetings brothers"
            });
            return state;
        });
    })

    act(()=>{
        orchestartor.emit("PENDING_MSG", "hello from east", 4123124314 );
    });

    //data should go into pending message container
    expect(messgesContainer.current.state.pendingMsgsContainer).toEqual([{
        id: 4123124314,
        userId: 342,
        userName: "testUser",
        content: "hello from east"
    }]);

    //nothing to go into msgsCOntainer
    expect(messgesContainer.current.state.msgsContainer.length).toEqual(3);

    //expect the dom to contain 4 msg
    expect(document.getElementsByClassName("messages-container")[0].children.length).toBe(4);

    //expect the pending msg to be the first one
    expect(document.getElementsByClassName("messages-container")[0].children[0].id).toEqual("4123124314");

});

test("requesting previous messages from the component", ()=>{
    const messgesContainer = createRef();

    act(()=>{
        render(<globalContext.Provider value={{
            socket: clientSocket,
            securityClient: securityClient,
            orchestrator: orchestartor,
            roomName: "testRoom",
            userName: "testUser"
        }}>
            <MessagesContainerComponent ref={messgesContainer}/>
        </globalContext.Provider>, container);
    });

    //set messages in the container
    messgesContainer.current.setState((state)=>{
        state.msgsContainer.unshift({
            id: 12,
            sender: "amr",
            content: "hello"
        },{
            id: 11,
            sender: "ayman",
            content: "hello lads"   
        },{
            id: 10,
            sender: "ali",
            content: "greetings brothers"
        });
    });

    clientSocket.sendToSocket("PREVIOUS_MSGS_REQUEST", 10, "3627E32F");

    //expect the result to be array containing 3 messages
    expect(clientSocket.emmitedEvents["PREVIOUS_MSGS"][0].length).toBe(2);
    
    //expect userId to be the same as we sent it to the socket
    expect(clientSocket.emmitedEvents["PREVIOUS_MSGS"][1]).toEqual("3627E32F");
});

test("recieving previous messages from server", ()=>{
    const messgesContainer = createRef();

    act(()=>{
        render(<globalContext.Provider value={{
            socket: clientSocket,
            securityClient: securityClient,
            orchestrator: orchestartor,
            roomName: "testRoom",
            userName: "testUser"
        }}>
            <MessagesContainerComponent ref={messgesContainer}/>
        </globalContext.Provider>, container);
    });

    //set the initial state
    act(()=>{
        messgesContainer.current.setState((state)=>{
            state.msgsContainer.unshift({
                id: 9,
                sender: "amr",
                content: "hello"
            },{
                id: 8,
                sender: "ayman",
                content: "hello lads"   
            },{
                id: 2,
                sender: "ali",
                content: "greetings brothers"
            });
        });
    });

    //prepare server msgs
    let msgs =[
        {
            id: 7,
            sender: "ali",
            content: securityClient.encryptMsg("hello lads")
        },
        {
            id: 6,
            sender: "amr",
            content: securityClient.encryptMsg("hi ali, welcome")
        },
        {
            id: 5,
            sender: "hussein",
            content: securityClient.encryptMsg("ok dudes")
        },
        {
            id: 4,
            sender: "salem",
            content: securityClient.encryptMsg("great to gather")
        },
    ]

    clientSocket.sendToSocket("PREVIOUS_MSGS", msgs);

    //expect that container will have 7 msgs
    expect(document.getElementsByClassName("messages-container")[0].children.length).toEqual(7);

    //expect that ids are arranged in the container
    expect(document.getElementsByClassName("messages-container")[0].children[0].id).toEqual("9");

    //expect the third one to be of id =7
    expect(document.getElementsByClassName("messages-container")[0].children[2].id).toEqual("7");

    //expect the last one to be of id =2
    expect(document.getElementsByClassName("messages-container")[0].lastChild.id).toEqual("2");

    //expect msgs to be decrypted
    expect(document.getElementsByClassName("messages-container")[0].lastElementChild.lastElementChild.innerHTML).toEqual("greetings brothers")

});

test("expecting to recieve pending msgs after recieving previous messages", ()=>{
    const messgesContainer = createRef();

    act(()=>{
        render(<globalContext.Provider value={{
            socket: clientSocket,
            securityClient: securityClient,
            orchestrator: orchestartor,
            roomName: "testRoom",
            userName: "testUser"
        }}>
            <MessagesContainerComponent ref={messgesContainer}/>
        </globalContext.Provider>, container);
    });

    //set the initial state
    act(()=>{
        messgesContainer.current.setState((state)=>{
            state.pendingMsgsContainer.unshift({
                id: "tempId1",
                sender: "amr",
                content: "hello"
            },{
                id: "tempId2",
                sender: "ayman",
                content: "hello lads"   
            });
            return state;
        });
    });

    clientSocket.sendToSocket("PREVIOUS_MSGS", []);

    //pending msgs are 2 when emmitted
    expect(clientSocket.emmitedEvents["PENDING_MSGS"][0].length).toEqual(2);

    //pending messages are encrypted
    expect(clientSocket.emmitedEvents["PENDING_MSGS"][0][0]).not.toEqual("hello");
});

test("binary search on the container", ()=>{
    const messgesContainer = createRef();

    act(()=>{
        render(<globalContext.Provider value={{
            socket: clientSocket,
            securityClient: securityClient,
            orchestrator: orchestartor,
            roomName: "testRoom",
            userName: "testUser"
        }}>
            <MessagesContainerComponent ref={messgesContainer}/>
        </globalContext.Provider>, container);
    });

        //set the initial state
        act(()=>{
            messgesContainer.current.setState((state)=>{
                state.msgsContainer.unshift({
                    id: 9,
                    sender: "amr",
                    content: "hello"
                },{
                    id: 8,
                    sender: "ayman",
                    content: "hello lads"   
                },{
                    id: 6,
                    sender: "ali",
                    content: "greetings brothers"
                },{
                    id: 5,
                    sender: "ayman",
                    content: "hello lads"   
                },{
                    id: 4,
                    sender: "ali",
                    content: "greetings brothers"
                },{
                    id: 2,
                    sender: "ayman",
                    content: "hello lads"   
                },{
                    id: 1,
                    sender: "ali",
                    content: "greetings brothers"
                });
            });
        });
    
    let index = messgesContainer.current.binarySearchMsgs(3, 0, messgesContainer.current.state.msgsContainer.length-1);
    expect(index).toEqual(5);

})

test("recieving a message from the server", ()=>{
    const messgesContainer = createRef();

    act(()=>{
        render(<globalContext.Provider value={{
            socket: clientSocket,
            securityClient: securityClient,
            orchestrator: orchestartor,
            roomName: "testRoom",
            userName: "testUser"
        }}>
            <MessagesContainerComponent ref={messgesContainer}/>
        </globalContext.Provider>, container);
    });

    //set the internal state of the container
    messgesContainer.current.setState((state)=>{
        state.msgsContainer.unshift({
            id: 3,
            sender: "hussein",
            content: "hi"
        },{
            id: 2,
            sender: "wali",
            content: "hi man"
        },{
            id: 1,
            sender: "rashed",
            content: "waiting for you"
        })
    });

    act(()=>{
        clientSocket.sendToSocket("MSG", {
            id: 23,
            sender: "ali",
            content: securityClient.encryptMsg("hello lads")
        });
    });

    //expecting the container to have 4 msgs, begining with id = 23
    expect(document.getElementsByClassName("messages-container")[0].children.length).toBe(4);
    expect(document.getElementsByClassName("messages-container")[0].children[0].id).toEqual("23");

    //expect the second on to be of id=3
    expect(document.getElementsByClassName("messages-container")[0].children[1].id).toEqual("3");
});

test("recieving ack after sending a message", ()=>{
    const messgesContainer = createRef();

    act(()=>{
        render(<globalContext.Provider value={{
            socket: clientSocket,
            securityClient: securityClient,
            orchestrator: orchestartor,
            roomName: "testRoom",
            userName: "testUser"
        }}>
            <MessagesContainerComponent ref={messgesContainer}/>
        </globalContext.Provider>, container);
    });

    //set the internal state
    act(()=>{
        //message must be pending
        messgesContainer.current.setState((state)=>{
            state.pendingMsgsContainer.unshift({
                id: "34245464",
                sender: "testUser",
                content: "welcome"
            });
        });
    });

    act(()=>{
        clientSocket.sendToSocket("MSG_ACK", "34245464", 23);
    });

    //expect the document to contain a single msg with the new id = 23
    expect(document.getElementsByClassName("messages-container")[0].children[0].id).toEqual("23");
    
});

