import React from "react";
import { useNavigate } from "react-router";
import './home.component.css';



export default function HomeComponent(){

    const navigate = useNavigate();

    return(
        <div className="home">
            <button onClick={()=>{ navigate("/create-room");}}>Create<br/>Room</button>
            <button onClick={()=>{ navigate("/join-room");}}>Join<br/>Room</button>
        </div>
    );

}