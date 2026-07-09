import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Breadcrumbs({ items }) {
  const location = useLocation();

  useEffect(() => {
    // Inject dynamic BreadcrumbList Schema for Rich Results validation
    const oldBreadcrumbSchema = document.querySelectorAll('script[type="application/ld+json"].himalix-breadcrumb-schema');
    oldBreadcrumbSchema.forEach(tag => tag.remove());

    if (items && items.length > 0) {
      const origin = window.location.origin;
      const breadcrumbList = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": origin
          },
          ...items.map((item, idx) => ({
            "@type": "ListItem",
            "position": idx + 2,
            "name": item.label,
            "item": item.path ? (item.path.startsWith('http') ? item.path : `${origin}${item.path}`) : `${origin}${location.pathname}`
          }))
        ]
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.className = 'himalix-breadcrumb-schema';
      script.text = JSON.stringify(breadcrumbList);
      document.head.appendChild(script);
    }

    return () => {
      const oldBreadcrumbSchema = document.querySelectorAll('script[type="application/ld+json"].himalix-breadcrumb-schema');
      oldBreadcrumbSchema.forEach(tag => tag.remove());
    };
  }, [items, location]);

  if (!items || items.length === 0) return null;

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumbs__list">
        <li className="breadcrumbs__item">
          <Link to="/" className="breadcrumbs__link" title="Himalix Labs Home">
            <i className="fa-light fa-house" style={{ fontSize: '10px' }} />
            <span>Home</span>
          </Link>
        </li>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="breadcrumbs__item">
              <span className="breadcrumbs__separator" aria-hidden="true">/</span>
              {isLast || !item.path ? (
                <span className="breadcrumbs__current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link to={item.path} className="breadcrumbs__link" title={`Go to ${item.label}`}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
