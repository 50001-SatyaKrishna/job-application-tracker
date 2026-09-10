// src/components/Navbar.jsx

function Navbar(props) {
    console.log(props.name);
    return (
        <nav>
            <h2>Welcome, {props.name}!</h2>
        </nav>
    );
}

export default Navbar;