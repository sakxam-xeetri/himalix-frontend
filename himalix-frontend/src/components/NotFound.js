import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found__code" aria-hidden="true">
        404
      </div>

      <div>
        <h1 className="not-found__title">
          Page not found
        </h1>
        <p className="not-found__desc">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>

      <div className="not-found__actions">
        <Link to="/" className="btn btn-primary">
          <i className="fa-light fa-sharp fa-house" /> Go Home
        </Link>
        <Link to="/store" className="btn btn-outline">
          <i className="fa-light fa-sharp fa-store" /> Visit Store
        </Link>
      </div>
    </div>
  );
}
