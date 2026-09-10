function Sidebar({ activeView, setActiveView, onLogout }) {
    const navItems = [
        { key: "applications", label: "Applications" },
        { key: "add", label: "Add Application" }
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">JobTracker</div>

            <nav className="sidebar-nav" aria-label="Sidebar navigation">
                {navItems.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        className={activeView === item.key ? "nav-button active" : "nav-button"}
                        onClick={() => setActiveView(item.key)}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>

            <button type="button" className="sidebar-logout" onClick={onLogout}>
                Logout
            </button>
        </aside>
    );
}

export default Sidebar;
