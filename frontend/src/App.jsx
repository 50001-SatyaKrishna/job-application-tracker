import { useEffect, useState } from "react";
import { AgGridProvider } from "ag-grid-react";
import { AllCommunityModule } from "ag-grid-community";

import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import JobList from "./components/JobList";
import AddJob from "./components/AddJob";
import "./App.css";

const modules = [AllCommunityModule];

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem("access_token")));
    const [activeView, setActiveView] = useState("applications");
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        setIsAuthenticated(Boolean(localStorage.getItem("access_token")));
    }, []);

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
        setActiveView("applications");
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        setIsAuthenticated(false);
        setActiveView("applications");
    };

    const handleJobAdded = () => {
        setRefreshKey((value) => value + 1);
        setActiveView("applications");
    };

    return (
        <AgGridProvider modules={modules}>
            <div className="app-shell">
                {!isAuthenticated ? (
                    <Login onLoginSuccess={handleLoginSuccess} />
                ) : (
                    <div className="dashboard-shell">
                        <Sidebar activeView={activeView} setActiveView={setActiveView} onLogout={handleLogout} />

                        <main className="main-panel">
                            {activeView === "applications" ? (
                                <JobList key={refreshKey} onLogout={handleLogout} />
                            ) : (
                                <AddJob onJobAdded={handleJobAdded} />
                            )}
                        </main>
                    </div>
                )}
            </div>
        </AgGridProvider>
    );
}

export default App;