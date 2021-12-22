import React, { Fragment } from "react";
import { useHistory } from "react-router";
import './home.component.css';



export default function HomeComponent(){

    const history = useHistory();

    return(
        <Fragment>
            <header className="home-header">
                <img alt="logo.png" src="./logo.png"/>
                <label><b>Connect</b></label>
            </header>
            <div className="home">
                <button onClick={()=>{ history.push("/create-room");}}>Create<br/>Room</button>
                <button onClick={()=>{ history.push("/join-room");}}>Join<br/>Room</button>
            </div>
            <footer> connect</footer>
        </Fragment>
    );

}