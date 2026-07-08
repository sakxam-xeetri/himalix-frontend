import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function SEO({
  title,
  description,
  canonical,
  ogType = 'website',
  ogImage = '/social_preview.png',
  keywords,
  robots = 'index, follow',
  schema,
  brand = 'Himalix Labs',
  author = 'Himalix Labs',
  themeColor = '#111111'
}) {
  const location = useLocation();

  useEffect(() => {
    // 1. Title (Primary keyword first, brand last, max 60 chars)
    let fullTitle = title;
    if (brand && !title.includes(brand)) {
      fullTitle = `${title} | ${brand}`;
    }
    if (fullTitle.length > 60) {
      fullTitle = fullTitle.substring(0, 57) + '...';
    }
    document.title = fullTitle;

    // 2. Canonical URL
    const finalCanonical = canonical || `${window.location.origin}${location.pathname}`;
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', finalCanonical);

    // Helpers to update meta tags
    const updateMeta = (nameAttr, valueAttr, nameVal, contentVal) => {
      let tag = document.querySelector(`meta[${nameAttr}="${nameVal}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(nameAttr, nameVal);
        document.head.appendChild(tag);
      }
      tag.setAttribute(valueAttr, contentVal || '');
    };

    // Standard Meta Tags
    updateMeta('name', 'content', 'description', description || 'Himalix Labs is an industry-leading technology provider in Nepal, delivering advanced hardware, robotics, embedded systems, custom software, and 3D printing services.');
    updateMeta('name', 'content', 'keywords', keywords || 'arduino, raspberry pi, pcb design, robotics, custom websites, iot, 3d printing nepal, himalix labs');
    updateMeta('name', 'content', 'robots', robots);
    updateMeta('name', 'content', 'author', author);
    updateMeta('name', 'content', 'theme-color', themeColor);
    updateMeta('name', 'content', 'viewport', 'width=device-width, initial-scale=1.0, shrink-to-fit=no');
    updateMeta('name', 'content', 'application-name', 'Himalix Labs');
    updateMeta('name', 'content', 'publisher', 'Himalix Labs');
    updateMeta('name', 'content', 'copyright', `Copyright © ${new Date().getFullYear()} Himalix Labs`);
    updateMeta('name', 'content', 'format-detection', 'telephone=no, address=no, email=no');

    // OpenGraph
    updateMeta('property', 'content', 'og:title', title);
    updateMeta('property', 'content', 'og:description', description);
    updateMeta('property', 'content', 'og:url', finalCanonical);
    updateMeta('property', 'content', 'og:type', ogType);
    updateMeta('property', 'content', 'og:site_name', 'Himalix Labs');
    updateMeta('property', 'content', 'og:locale', 'en_US');
    if (ogImage) {
      const fullImgUrl = ogImage.startsWith('http') ? ogImage : `${window.location.origin}${ogImage}`;
      updateMeta('property', 'content', 'og:image', fullImgUrl);
      updateMeta('property', 'content', 'og:image:secure_url', fullImgUrl);
      updateMeta('property', 'content', 'og:image:type', 'image/jpeg');
    }

    // Twitter Card
    updateMeta('name', 'content', 'twitter:card', 'summary_large_image');
    updateMeta('name', 'content', 'twitter:title', title);
    updateMeta('name', 'content', 'twitter:description', description);
    if (ogImage) {
      const fullImgUrl = ogImage.startsWith('http') ? ogImage : `${window.location.origin}${ogImage}`;
      updateMeta('name', 'content', 'twitter:image', fullImgUrl);
    }

    // 3. Dynamic JSON-LD Structured Data
    const oldSchemaTags = document.querySelectorAll('script[type="application/ld+json"].himalix-seo-schema');
    oldSchemaTags.forEach(tag => tag.remove());

    if (schema) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.className = 'himalix-seo-schema';
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
    }

  }, [title, description, canonical, ogType, ogImage, keywords, robots, schema, brand, author, themeColor, location]);

  return null;
}
