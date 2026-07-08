import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import NotFound from '../components/NotFound';
import { useAuth } from '../auth/AuthContext';
import Footer from '../components/Footer';

export default function MemberProfile() {
  const { memberEndpoint } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { authFetch } = useAuth();

  useEffect(() => {
    setLoading(true);
    setError(false);
    
    authFetch(`/api/content/team/${memberEndpoint}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Not found');
        }
        return res.json();
      })
      .then(data => {
        if (data.success && data.member) {
          setMember(data.member);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [memberEndpoint, authFetch]);

  if (loading) {
    return (
      <div className="store-page" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-1)' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fa-light fa-spinner-third fa-spin" style={{ fontSize: '2.5rem', color: 'var(--accent)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-2)' }}>Retrieving profile...</p>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return <NotFound />;
  }

  const getSocialIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return 'fa-brands fa-instagram';
      case 'github': return 'fa-brands fa-github';
      case 'linkedin': return 'fa-brands fa-linkedin';
      case 'facebook': return 'fa-brands fa-facebook';
      default: return 'fa-light fa-globe';
    }
  };

  return (
    <div className="store-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-1)', paddingTop: '100px' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8) var(--space-4)' }}>
        <div style={{
          width: '100%',
          maxWidth: '500px',
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: 'var(--space-8)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }} className="profile-card-container">
          
          <div style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
            opacity: 0.15,
            pointerEvents: 'none'
          }} />

          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 'var(--space-6)' }}>
            <div style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              padding: '4px',
              background: 'linear-gradient(135deg, var(--accent), transparent)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
            }}>
              <img 
                src={member.avatar_url || '/placeholder.svg'} 
                alt={member.name}
                onError={(e) => { e.target.src = '/placeholder.svg'; }}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--bg-1)'
                }}
              />
            </div>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-0)', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            {member.name}
          </h1>
          <div style={{
            display: 'inline-block',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            background: 'rgba(212, 160, 23, 0.1)',
            border: '1px solid rgba(212, 160, 23, 0.2)',
            padding: '4px 12px',
            borderRadius: '20px',
            marginBottom: 'var(--space-6)'
          }}>
            {member.role}
          </div>

          {member.bio && (
            <p style={{ color: 'var(--text-2)', fontSize: '14px', lineHeight: '1.6', margin: '0 0 var(--space-6) 0' }}>
              {member.bio}
            </p>
          )}

          {member.sayings && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderLeft: '4px solid var(--accent)',
              borderRadius: '0 12px 12px 0',
              padding: '16px',
              textAlign: 'left',
              marginBottom: 'var(--space-6)',
              position: 'relative'
            }}>
              <span style={{
                position: 'absolute',
                top: '4px',
                left: '8px',
                fontSize: '32px',
                color: 'rgba(212, 160, 23, 0.15)',
                fontFamily: 'serif',
                lineHeight: 1
              }}>"</span>
              <div style={{
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--text-3)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '6px'
              }}>
                {member.name.split(' ')[0]}'s Sayings
              </div>
              <p style={{
                margin: 0,
                color: 'var(--text-1)',
                fontSize: '13px',
                fontStyle: 'italic',
                lineHeight: '1.5',
                paddingLeft: '10px'
              }}>
                {member.sayings}
              </p>
            </div>
          )}

          {(member.email || member.phone) && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
              padding: '16px 0',
              marginBottom: 'var(--space-6)',
              textAlign: 'left'
            }}>
              {member.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: 'var(--text-2)' }}>
                  <i className="fa-light fa-envelope" style={{ color: 'var(--accent)', width: '18px', textAlign: 'center' }} />
                  <a href={`mailto:${member.email}`} style={{ color: 'var(--text-1)', textDecoration: 'none' }} className="hover-underline">
                    {member.email}
                  </a>
                </div>
              )}
              {member.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: 'var(--text-2)' }}>
                  <i className="fa-light fa-phone" style={{ color: 'var(--accent)', width: '18px', textAlign: 'center' }} />
                  <a href={`tel:${member.phone}`} style={{ color: 'var(--text-1)', textDecoration: 'none' }}>
                    {member.phone}
                  </a>
                </div>
              )}
            </div>
          )}

          {member.socials && member.socials.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: 'var(--space-6)' }}>
              {member.socials.map((s, idx) => {
                if (!s.url) return null;
                return (
                  <a 
                    key={idx}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-1)',
                      fontSize: '18px',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    className="social-icon-btn"
                  >
                    <i className={getSocialIcon(s.platform)} />
                  </a>
                );
              })}
            </div>
          )}

          <Link to="/" className="btn btn-outline btn-sm" style={{ width: '100%' }}>
            <i className="fa-light fa-arrow-left" style={{ marginRight: '6px' }} /> Back to Home
          </Link>
          
        </div>
      </div>
      <Footer />
    </div>
  );
}
