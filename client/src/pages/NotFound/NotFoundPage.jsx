import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import './NotFound.css';

function NotFoundPage() {
  return (
    <div className="not-found">
      <div className="not-found__content animate-fade-in-up">
        <span className="not-found__code">404</span>
        <h1 className="not-found__title">Page Not Found</h1>
        <p className="not-found__desc">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>
        <div className="not-found__actions">
          <Button variant="primary" size="lg" to="/">Go Home</Button>
          <Button variant="secondary" size="lg" to="/fashion">Explore Styles</Button>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
