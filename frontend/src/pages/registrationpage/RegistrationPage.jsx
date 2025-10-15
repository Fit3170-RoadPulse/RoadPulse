import React from "react";
import { Link } from "react-router-dom";
import "./RegistrationPage.css";
import LoginPage from "../loginpage/Login";

export default function RegisterPage({ onRegister, onLogin }) {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");

    function handleRegister() {
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        const values = { username, password };
        if (typeof onRegister === "function") {
            onRegister(values);
        } else {
            alert("Register pressed — values: " + JSON.stringify(values, null, 2));
        }
    }

    return (
        <div className="register-container">
            <h1 className="register-title">Sign up!</h1>
            <p className="register-hint">Create your account.</p>

            <div className="register-field">
                <label className="register-label">Username:</label>
                <input
                    className="register-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                />
            </div>

            <div className="register-field">
                <label className="register-label">Email:</label>
                <input
                    className="register-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Enter your email"
                    type="password"
                />
            </div>

            <div className="register-field">
                <label className="register-label">Password:</label>
                <input
                    className="register-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    type="password"
                />
            </div>

            <div className="register-buttons">
                <button onClick={handleRegister} className="register-primaryBtn">
                Register
                </button>
            </div>
            


            <p className="login-link-text">
            Already have an account? 
            <Link to="/login-page" className="login-linkBtn">
                    Login
            </Link>
            </p>
        </div>
    );
}
