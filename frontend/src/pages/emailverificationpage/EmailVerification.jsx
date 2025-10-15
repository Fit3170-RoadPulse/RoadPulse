import React from "react";
import { Link } from "react-router-dom";
import "./EmailVerification.css";


export default function EmailVerification() {

    function handleLogin() {
    const values = { username, password, remember };
    if (typeof onLogin === "function") onLogin(values);
    else alert("Login pressed — values: " + JSON.stringify(values, null, 2));
    }

    return(
        <div className="container">
            <div className="title">
                <div className="title1">
                    Email verified! 
                </div>

                <div className="title2">
                    Your account has been activated
                </div>
            </div>
            


            <div className="login-button">
                <Link to="/login-page" className="login-primaryBtn">
                    Login
                </Link>
                
            </div>
        </div>
    )
}