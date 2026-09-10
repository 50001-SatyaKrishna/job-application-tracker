import { useState } from "react";

const API_BASE_URL = "http://localhost:8000";

function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function loginUser(event) {
        event.preventDefault();

        if (!email || !password) {
            alert("Please enter both email and password.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.detail || "Login failed");
                return;
            }

            localStorage.setItem("access_token", data.access_token);
            onLoginSuccess?.();
        } catch (error) {
            console.error("Error connecting to backend:", error);
            alert("Could not connect to the backend server.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <p className="eyebrow">Job Tracker</p>
                    <h1>Sign in</h1>
                </div>

                <form className="auth-form" onSubmit={loginUser}>
                    <label>
                        <span>Email</span>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                        />
                    </label>

                    <label>
                        <span>Password</span>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                    </label>

                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Signing in..." : "Login"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;