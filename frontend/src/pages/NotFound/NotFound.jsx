import { Link } from 'react-router-dom';
import "./NotFound.css"

function NotFound() {
    return (
        <div>
            <h1>404 - Not Found</h1>
            
            <Link to="/">Go to homepage</Link>
        </div>
    );
}

export default NotFound;