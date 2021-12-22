/**
 * @jest-environment jsdom
 */

import React, { createRef } from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { act } from "react-dom/test-utils";


jest.mock("socket.io-client", ()=>{
    const createFakeSocketIo =  require("./socket-clientFake");
    return createFakeSocketIo();
});

jest.mock("../components/room/header/header.component");
jest.mock("../components/room/connectedUsersList/connectedUsersList.component");
jest.mock("../components/room/messages/messages.component");



beforeAll((done)=>{
    done();
});

beforeEach((done)=>{

    done();
});

afterEach((done) => {
    done();
});

test("sync msg event on firing sync connected users complete", ()=>{

    const container = document.createElement("div");
    document.body.appendChild(container);
    const roomComponent = createRef();

    return import("../components/app/room/room.component")
    .then((RoomComponent)=>{
        
        act(()=>{
            render(<RoomComponent.default ref={roomComponent}></RoomComponent.default>, container);
        });

        //fake a callback
        let callback = jest.fn();

        //attach orchestrator listener
        roomComponent.current.orchestrator.on("SYNC_MSGS", callback);

        //fire SYNC_CONNECTED_USERS_COMPLETE
        roomComponent.current.orchestrator.emit("SYNC_CONNECTED_USERS_COMPLETE");

        expect(callback).toHaveBeenCalledTimes(1); 

        unmountComponentAtNode(container);
    });

});



