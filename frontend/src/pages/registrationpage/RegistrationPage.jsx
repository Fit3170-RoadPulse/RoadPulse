import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./RegistrationPage.css";

const validatePassword = (password) => {
    if (password.length < 8) {
        return "Password must be at least 8 characters long.";
    }

    // check for at least on letter
    if (!/[a-zA-Z]/.test(password)) {
        return "Password must include at least one letter.";
    }

    // check for at least one number
    if (!/\d/.test(password)) {
        return "Password must include at least one number (0-9).";
    }

    // check for at least one special character
    if (!/[^a-zA-Z0-9]/.test(password)) {
        return "Password must include at least one special character";
    }

    return null; // validation passed
};

const validateEmail = (email) => {
    // Basic regex check for email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return "Please enter a valid email address.";
    }
    return null;
};

const validateUsername = (username) => {
    if (username.length < 3) {
        return "Username must be at least 3 characters long.";
    }
    return null;
};

export default function RegisterPage({ onRegister, navigateTo }) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isRegistered, setIsRegistered] = useState(false);
    const navigate = useNavigate();
    const [show, setShow] = useState({ current: false });
    const toggle = (field) => setShow((s) => ({ ...s, [field]: !s[field] }));

    async function handleRegister() {
    
        setErrorMessage(""); // clear previous errors

        // validate username
        let error = validateUsername(username);
        // if (error) return setErrorMessage(error);
        if (error) {
            alert(error);
            return;
        }

        // validate email
        error = validateEmail(email);
        // if (error) return setErrorMessage(error);
        if (error) {
            alert(error);
            return;
        }

        // validate password
        error = validatePassword(password);
        // if (error) return setErrorMessage(error);
        if (error) {
            alert(error);
            return;
        }

        // if (password !== confirmPassword) {
        //     alert("Passwords do not match!");
        //     return;
        // }
        try {
        const res = await fetch("http://localhost:8000/api/register/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password }),
        });

        const text = await res.text(); // get raw response
        let data;
        try {
            data = JSON.parse(text); // try parsing JSON
        } catch {
            console.error("Non-JSON response:", text);
            alert("Server error occurred. Check console.");
            return;
        }

        if (res.ok) {
            // successful registration
            setIsRegistered(true);
            if (typeof onRegister === "function") onRegister({ username, email, password });
            navigate("/email-verification");
        } else {
            // backend returned error JSON
            alert(JSON.stringify(data));
        }
    } catch (err) {
        console.error("Network or fetch error:", err);
        alert("Network error. Check backend server.");
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                />
            </div>

            <div className="register-field">
                <label className="register-label">Password:</label>
                
                <input
                    className="register-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    type={show.current ? "text" : "password"}
                />
                <button
                    type="button"
                    className="register-icon-btn"
                    onClick={() => toggle("current")}
                    aria-label="Toggle new password visibility"
                >
                    {show.current ? "👁️" : "🙈"}
                </button>
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
