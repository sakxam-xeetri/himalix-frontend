import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

import Footer from '../components/Footer';
import ScrollReveal from '../components/ScrollReveal';
import AnimatedCounter from '../components/AnimatedCounter';
import SEO from '../components/SEO';

/* ── Inline interactive hooks ── */

/** Mouse-tracking parallax for hero orbs */
function useMouseParallax() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      el.style.setProperty('--mx', x.toFixed(3));
      el.style.setProperty('--my', y.toFixed(3));
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);
  return ref;
}

/** Scroll progress bar (0→1) */
function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? window.scrollY / h : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return progress;
}

/** Tilt card on mouse hover */
function useTiltHandlers() {
  const onMouseMove = useCallback((e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    card.style.transform = `perspective(600px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px)`;
  }, []);
  const onMouseLeave = useCallback((e) => {
    e.currentTarget.style.transform = '';
  }, []);
  return { onMouseMove, onMouseLeave };
}

/** Lightweight hero particles canvas */
function HeroParticles() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const resize = () => {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    const dots = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      o: Math.random() * 0.4 + 0.1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
        if (d.y < 0 || d.y > canvas.height) d.vy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${d.o})`;
        ctx.fill();
      });
      // connections
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(255,255,255,${(1 - dist / 100) * 0.06})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="hero__particles" aria-hidden="true" />;
}

/** Marquee strip */
const marqueeItems = [
  { icon: 'microchip', text: 'Electronics' },
  { icon: 'cube', text: '3D Printing' },
  { icon: 'globe', text: 'Web Development' },
  { icon: 'code', text: 'IoT & Software' },
  { icon: 'store', text: 'Online Store' },
  { icon: 'truck-fast', text: 'Fast Delivery' },
  { icon: 'shield-check', text: 'Quality Assured' },
  { icon: 'headset', text: '24/7 Support' },
];

const landingSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://himalixlabs.tech/#organization",
      "name": "Himalix Labs",
      "url": "https://himalixlabs.tech",
      "logo": "https://himalixlabs.tech/uploads/site_logo.png",
      "sameAs": [
        "https://facebook.com/himalixlabs",
        "https://github.com/zenithkandel/himalix-lab-mimo"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://himalixlabs.tech/#website",
      "url": "https://himalixlabs.tech",
      "name": "Himalix Labs",
      "publisher": {
        "@id": "https://himalixlabs.tech/#organization"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://himalixlabs.tech/store?search={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "LocalBusiness",
      "@id": "https://himalixlabs.tech/#localbusiness",
      "name": "Himalix Labs",
      "image": "https://himalixlabs.tech/uploads/site_logo.png",
      "url": "https://himalixlabs.tech",
      "telephone": "9801234567",
      "priceRange": "$$",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Kathmandu Nepal",
        "addressLocality": "Kathmandu",
        "addressRegion": "Bagmati",
        "postalCode": "44600",
        "addressCountry": "NP"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "27.7172",
        "longitude": "85.3240"
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday"
        ],
        "opens": "00:00",
        "closes": "23:59"
      }
    }
  ]
};

export default function Landing() {
  const [content, setContent] = useState(null);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [activeServiceTab, setActiveServiceTab] = useState(0);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactState, setContactState] = useState('idle'); // idle | loading | success | error
  const contactTimerRef = useRef(null);

  /* Interactive hooks */
  const heroParallaxRef = useMouseParallax();
  const scrollProgress = useScrollProgress();
  const tilt = useTiltHandlers();

  /* Fetch CMS content */
  useEffect(() => {
    fetch('/api/content')
      .then(r => {
        if (!r.ok) throw new Error('CMS content fetch failed');
        return r.json();
      })
      .then(data => setContent(data))
      .catch(() => setContent({}));
  }, []);

  /* Testimonial auto-rotation */
  const testimonials = (content?.testimonials && content.testimonials.length > 0) ? content.testimonials : defaultTestimonials;
  useEffect(() => {
    if (testimonials.length <= 1) return;
    const t = setInterval(() => {
      setTestimonialIdx(i => (i + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(t);
  }, [testimonials.length]);

  /* Contact form */
  const handleContact = async (e) => {
    e.preventDefault();
    setContactState('loading');
    try {
      const res = await fetch('/api/content/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      if (!res.ok) throw new Error();
      setContactState('success');
      setContactForm({ name: '', email: '', message: '' });
      contactTimerRef.current = setTimeout(() => setContactState('idle'), 6000);
    } catch {
      setContactState('error');
    }
  };

  useEffect(() => () => clearTimeout(contactTimerRef.current), []);

  const hero = content?.content?.hero || defaultHero;
  const services = (content?.services && content.services.length > 0) ? content.services : defaultServices;
  const about = content?.content?.about || defaultAbout;
  const stats = (content?.statistics && content.statistics.length > 0) ? content.statistics : defaultStats;
  const team = (content?.team && content.team.length > 0) ? content.team : defaultTeam;

  return (
    <div className="landing">
      <SEO
        title="Advanced Tech, PCB & 3D Printing Service Nepal"
        description="Himalix Labs is Nepal's premier technology solutions hub. We build advanced hardware, custom PCBs, and premium 3D printing custom parts."
        keywords="pcb design nepal, 3d printing service nepal, robotics, embedded systems, electronics store nepal"
        schema={landingSchema}
      />

      {/* ── Scroll Progress Bar ── */}
      <div className="scroll-progress" style={{ transform: `scaleX(${scrollProgress})` }} aria-hidden="true" />

      {/* ── HERO ── */}
      <section className="hero" aria-labelledby="hero-title" ref={heroParallaxRef}>
        <div className="hero__bg">
          <div className="hero__grid" aria-hidden="true" />
          <div className="hero__accent-line" aria-hidden="true" />
          {/* Ambient glow orbs — parallax-driven */}
          <div className="hero__orb hero__orb--1" aria-hidden="true" />
          <div className="hero__orb hero__orb--2" aria-hidden="true" />
          <div className="hero__orb hero__orb--3" aria-hidden="true" />
        </div>
        <HeroParticles />
        <div className="hero__split">
          {/* LEFT — Copy */}
          <div className="hero__left">
            <div className="hero__eyebrow">
              <span className="hero__eyebrow-dot" />
              <i className="fa-light fa-sharp fa-location-dot" />
              Kathmandu, Nepal
            </div>
            <h1 id="hero-title" className="hero__title">
              {hero.title_before || "Nepal's Premier"}{' '}
              <em className="hero__title-shimmer">{hero.title_em || 'Technology'}</em>
              <br />{hero.title_after || 'Solutions Provider'}
            </h1>
            <p className="hero__subtitle">{hero.subtitle || 'From electronics to custom software — one platform, endless possibilities.'}</p>
            <div className="hero__actions">
              <Link to="/store" className="btn btn-primary btn-lg hero__btn-magnetic" title="Browse the electronic store products">
                <i className="fa-light fa-sharp fa-store" /> Visit Store
              </Link>
              <button
                className="btn btn-outline btn-lg hero__btn-magnetic"
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                title="Scroll down to explore our services showcase"
              >
                <i className="fa-light fa-sharp fa-arrow-down" /> Our Services
              </button>
            </div>
            {/* Trust badges */}
            <div className="hero__trust">
              <div className="hero__trust-item">
                <i className="fa-solid fa-shield-check" />
                <span>Verified Platform</span>
              </div>
              <div className="hero__trust-divider" />
              <div className="hero__trust-item">
                <i className="fa-solid fa-truck-fast" />
                <span>Nepal-Wide Delivery</span>
              </div>
              <div className="hero__trust-divider" />
              <div className="hero__trust-item">
                <i className="fa-solid fa-headset" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>

          {/* RIGHT — Service Cards with tilt */}
          <div className="hero__right">
            <div className="hero__cards">
              {[
                {
                  icon: 'store',
                  title: 'Himalix Store',
                  desc: 'Electronics, gadgets & components delivered across Nepal.',
                  link: '/store',
                  accent: '#6366f1',
                  accentRgb: '99, 102, 241',
                  delay: 0,
                },
                {
                  icon: 'cube',
                  title: '3D Printing',
                  desc: 'Professional FDM & resin printing for prototypes & parts.',
                  link: '/services/3d-printing',
                  accent: '#06b6d4',
                  accentRgb: '6, 182, 212',
                  delay: 1,
                },
                {
                  icon: 'globe',
                  title: 'Web Dev',
                  desc: 'Modern React, Next.js websites & full-stack applications.',
                  link: '/services/web-development',
                  accent: '#8b5cf6',
                  accentRgb: '139, 92, 246',
                  delay: 2,
                },
                {
                  icon: 'code',
                  title: 'Projects',
                  desc: 'Custom IoT, embedded systems & software consulting.',
                  link: '/project',
                  accent: '#f59e0b',
                  accentRgb: '245, 158, 11',
                  delay: 3,
                },
              ].map((card) => (
                <Link
                  key={card.title}
                  to={card.link}
                  className="hero-card"
                  style={{ 
                    '--card-accent': card.accent, 
                    '--card-accent-rgb': card.accentRgb, 
                    '--card-delay': card.delay 
                  }}
                  title={`Explore ${card.title}`}
                  onMouseMove={tilt.onMouseMove}
                  onMouseLeave={tilt.onMouseLeave}
                >
                  <div className="hero-card__glow" aria-hidden="true" />
                  <div className="hero-card__border-glow" aria-hidden="true" />
                  <div className="hero-card__icon">
                    <i className={`fa-light fa-sharp fa-${card.icon}`} />
                  </div>
                  <div className="hero-card__body">
                    <h3 className="hero-card__title">{card.title}</h3>
                    <p className="hero-card__desc">{card.desc}</p>
                  </div>
                  <div className="hero-card__arrow">
                    <i className="fa-light fa-sharp fa-arrow-right" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="hero__scroll-hint" aria-hidden="true">
          <i className="fa-light fa-sharp fa-chevron-down" />
          <span>Scroll</span>
        </div>
      </section>

      {/* ── MARQUEE STRIP ── */}
      <div className="marquee-strip" aria-hidden="true">
        <div className="marquee-strip__track">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="marquee-strip__item">
              <i className={`fa-light fa-sharp fa-${item.icon}`} />
              {item.text}
              <span className="marquee-strip__dot">●</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── SERVICES SHOWCASE SECTION ── */}
      <section className="section services" id="services" aria-labelledby="services-title">
        <div className="section__container">
          <ScrollReveal>
            <div className="section__header">
              <div className="section__eyebrow">
                <i className="fa-light fa-sharp fa-grid-2" /> What We Do
              </div>
              <h2 id="services-title" className="section__title">
                Four services. <span className="section__title-em">One platform.</span>
              </h2>
              <p className="section__subtitle">Select a service below to see exactly how to use our platform.</p>
            </div>
          </ScrollReveal>

          <div className="services-showcase">
            <div className="services-showcase__tabs">
              {services.map((service, idx) => {
                const iconClass = service.icon_class || service.icon;
                const fullIconClass = iconClass ? (iconClass.startsWith('fa-') ? iconClass : `fa-light fa-sharp fa-${iconClass}`) : 'fa-light fa-sharp fa-star';
                return (
                  <button
                    key={service.id || idx}
                    className={`services-showcase__tab-btn${activeServiceTab === idx ? ' services-showcase__tab-btn--active' : ''}`}
                    onClick={() => setActiveServiceTab(idx)}
                  >
                    <i className={fullIconClass} />
                    <span>{service.title}</span>
                  </button>
                );
              })}
            </div>

            <div className="services-showcase__pane" key={activeServiceTab}>
              <div className="services-showcase__left">
                <h3 className="services-showcase__title">
                  {services[activeServiceTab].title}
                </h3>
                <p className="services-showcase__desc">
                  {services[activeServiceTab].description}
                </p>
                {(() => {
                  let activeFeatures = services[activeServiceTab]?.features || [];
                  if (typeof activeFeatures === 'string') {
                    try { activeFeatures = JSON.parse(activeFeatures); } catch (e) { activeFeatures = []; }
                  }
                  if (!Array.isArray(activeFeatures)) activeFeatures = [];
                  if (activeFeatures.length === 0) return null;
                  return (
                    <ul className="services-showcase__features">
                      {activeFeatures.map((f, fi) => (
                        <li key={fi} className="services-showcase__feature-item">
                          <i className="fa-light fa-sharp fa-circle-check" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  );
                })()}
                <div style={{ marginTop: 'var(--space-4)' }}>
                  {(() => {
                    let serviceLink = services[activeServiceTab]?.link || services[activeServiceTab]?.link_url;
                    if (!serviceLink || serviceLink === '#') {
                      const title = (services[activeServiceTab]?.title || '').toLowerCase();
                      if (title.includes('3d') || title.includes('print')) serviceLink = '/services/3d-printing';
                      else if (title.includes('web')) serviceLink = '/services/web-development';
                      else if (title.includes('project')) serviceLink = '/project';
                      else if (title.includes('store') || title.includes('shop')) serviceLink = '/store';
                      else serviceLink = '/';
                    }
                    if (serviceLink === '/3d') serviceLink = '/services/3d-printing';
                    if (serviceLink === '/web') serviceLink = '/services/web-development';

                    return (
                      <Link to={serviceLink} className="btn btn-primary btn-lg">
                        {services[activeServiceTab].cta || 'Explore'} <i className="fa-light fa-sharp fa-arrow-right" style={{ marginLeft: 8 }} />
                      </Link>
                    );
                  })()}
                </div>
              </div>

              <div className="services-showcase__right">
                <h4 className="services-showcase__right-title">
                  <i className="fa-light fa-sharp fa-route" /> How to use this service
                </h4>
                <div className="services-showcase__steps">
                  {serviceSteps[activeServiceTab] && serviceSteps[activeServiceTab].map((step, si) => (
                    <div key={si} className="services-showcase__step">
                      <div className="services-showcase__step-num">{si + 1}</div>
                      <div className="services-showcase__step-content">
                        <div className="services-showcase__step-title">{step.title}</div>
                        <div className="services-showcase__step-desc">{step.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section className="section about" id="about" aria-labelledby="about-title">
        <div className="section__container">
          <div className="about__grid">
            <ScrollReveal from="left">
              <div>
                <div className="section__eyebrow">
                  <i className="fa-light fa-sharp fa-building" /> About Himalix Labs
                </div>
                <h2 id="about-title" className="section__title">{about.title || "Built for Nepal's tech future."}</h2>
                <p className="about__desc">{about.description || "Himalix Labs is a Kathmandu-based technology company delivering quality electronics, 3D printing services, web solutions, and custom software projects."}</p>
                <div className="about__pillars">
                  {(about.pillars || defaultPillars).map((p, i) => (
                    <div key={i} className="about__pillar">
                      <div className="about__pillar-icon">
                        <i className={`fa-light fa-sharp fa-${p.icon || 'star'}`} />
                      </div>
                      <div>
                        <div className="about__pillar-title">{p.title}</div>
                        <div className="about__pillar-text">{p.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal from="right">
              <div className="about__visual" aria-hidden="true">
                <div className="about__visual-grid-bg" />
                
                {/* Connection lines from center core to floating tags */}
                <svg className="about__visual-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <line x1="50" y1="50" x2="22" y2="18" className="about__line about__line--1" style={{ '--line-accent': '#3b82f6' }} />
                  <line x1="50" y1="50" x2="82" y2="33" className="about__line about__line--2" style={{ '--line-accent': '#06b6d4' }} />
                  <line x1="50" y1="50" x2="25" y2="58" className="about__line about__line--3" style={{ '--line-accent': '#8b5cf6' }} />
                  <line x1="50" y1="50" x2="78" y2="73" className="about__line about__line--4" style={{ '--line-accent': '#f59e0b' }} />
                  <line x1="50" y1="50" x2="35" y2="85" className="about__line about__line--5" style={{ '--line-accent': '#10b981' }} />
                </svg>

                {/* Central animated tech core */}
                <div className="about__visual-core">
                  <div className="about__visual-core-pulse" />
                  <div className="about__visual-core-pulse" style={{ animationDelay: '1.5s' }} />
                  <div className="about__visual-core-inner">
                    <i className="fa-solid fa-atom fa-spin" style={{ '--fa-animation-duration': '15s', color: 'var(--accent)' }} />
                  </div>
                </div>

                {aboutTags.map((tag, i) => {
                  const tagColors = ['#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981'];
                  return (
                    <div
                      key={i}
                      className="about__visual-tag"
                      style={{
                        ...tag.style,
                        '--float-idx': i,
                        '--tag-accent': tagColors[i]
                      }}
                    >
                      <i className={`fa-light fa-sharp fa-${tag.icon}`} /> {tag.label}
                    </div>
                  );
                })}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="section stats" aria-label="Company statistics">
        <div className="section__container">
          <ScrollReveal>
            <div className="stats__grid">
              {stats.map((stat, i) => (
                <div key={i} className="stat-card" style={{ '--stat-idx': i }}>
                  <div className="stat-card__icon">
                    <i className={`fa-light fa-sharp fa-${stat.icon || 'chart-bar'}`} />
                  </div>
                  <div className="stat-card__number">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix || ''} />
                  </div>
                  <div className="stat-card__label">{stat.label}</div>
                  <div className="stat-card__glow" aria-hidden="true" />
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section className="section team" id="team" aria-labelledby="team-title">
        <div className="section__container">
          <ScrollReveal>
            <div className="section__header">
              <div className="section__eyebrow">
                <i className="fa-light fa-sharp fa-users" /> Our Team
              </div>
              <h2 id="team-title" className="section__title">The people behind the platform.</h2>
            </div>
          </ScrollReveal>

          <div className="team__grid">
            {team.map((member, i) => (
              <ScrollReveal key={member.id || i} delay={i * 80}>
                <article className="team-card">
                  <div className="team-card__avatar">
                    {member.avatar_url
                      ? <img src={member.avatar_url} alt={member.name} />
                      : <i className="fa-light fa-sharp fa-user" />
                    }
                  </div>
                  <h3 className="team-card__name">{member.name}</h3>
                  <div className="team-card__role">{member.role}</div>
                  {member.bio && <p className="team-card__bio">{member.bio}</p>}
                  {member.socials && (
                    <div className="team-card__socials">
                      {member.socials.map(s => (
                        <a key={s.platform} href={s.url} target="_blank" rel="noopener noreferrer"
                          className="team-card__social" aria-label={s.platform}>
                          <i className={`fa-brands fa-${s.platform}`} />
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      {testimonials.length > 0 && (
        <section className="section testimonials" aria-labelledby="testimonials-title">
          <div className="section__container">
            <ScrollReveal>
              <div className="section__header" style={{ textAlign: 'center' }}>
                <div className="section__eyebrow">
                  <i className="fa-light fa-sharp fa-star" /> What Clients Say
                </div>
                <h2 id="testimonials-title" className="section__title" style={{ margin: '0 auto' }}>
                  Real feedback. Real results.
                </h2>
              </div>
            </ScrollReveal>

            <div className="testimonials__wrap">
              <div className="testimonials__card testimonials__card--animated" key={testimonialIdx}>
                <span className="testimonials__quote-mark">"</span>
                <div className="testimonials__stars" aria-label={`${testimonials[testimonialIdx].rating} stars`}>
                  {Array.from({ length: 5 }).map((_, si) => (
                    <i key={si}
                      className={`fa-${si < testimonials[testimonialIdx].rating ? 'solid' : 'light'} fa-sharp fa-star`}
                      style={{ animationDelay: `${si * 80}ms` }}
                    />
                  ))}
                </div>
                <p className="testimonials__text">{testimonials[testimonialIdx].text}</p>
                <div className="testimonials__author">
                  <div>
                    <div className="testimonials__author-name">{testimonials[testimonialIdx].name}</div>
                    <div className="testimonials__author-title">{testimonials[testimonialIdx].title}</div>
                  </div>
                </div>
              </div>

              {testimonials.length > 1 && (
                <div className="testimonials__nav" role="tablist" aria-label="Testimonial navigation">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      className={`testimonials__dot${i === testimonialIdx ? ' testimonials__dot--active' : ''}`}
                      onClick={() => setTestimonialIdx(i)}
                      role="tab"
                      aria-selected={i === testimonialIdx}
                      aria-label={`Testimonial ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── CONTACT ── */}
      <section className="section contact" id="contact" aria-labelledby="contact-title">
        <div className="section__container">
          <ScrollReveal>
            <div className="section__header">
              <div className="section__eyebrow">
                <i className="fa-light fa-sharp fa-envelope" /> Get In Touch
              </div>
              <h2 id="contact-title" className="section__title">Let's talk.</h2>
            </div>
          </ScrollReveal>

          <div className="contact__grid">
            {/* Form */}
            <div>
              {contactState === 'success' ? (
                <div className="contact__success">
                  <i className="fa-light fa-sharp fa-circle-check" />
                  <div>
                    <h3 style={{ color: 'var(--text-0)', marginBottom: 8 }}>Message sent!</h3>
                    <p style={{ color: 'var(--text-2)', fontSize: 'var(--text-sm)' }}>
                      We'll get back to you as soon as possible.
                    </p>
                  </div>
                </div>
              ) : (
                <form className="contact__form" onSubmit={handleContact} noValidate>
                  {contactState === 'error' && (
                    <div className="alert alert-danger">
                      <i className="fa-light fa-sharp fa-circle-exclamation" />
                      Failed to send. Try emailing us directly.
                    </div>
                  )}
                  <div className="form-group">
                    <label htmlFor="contact-name" className="form-label">
                      <i className="fa-light fa-sharp fa-user" /> Name
                    </label>
                    <input
                      id="contact-name"
                      className="form-input"
                      placeholder="Your name"
                      value={contactForm.name}
                      onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
                      required
                      disabled={contactState === 'loading'}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="contact-email" className="form-label">
                      <i className="fa-light fa-sharp fa-envelope" /> Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      className="form-input"
                      placeholder="you@example.com"
                      value={contactForm.email}
                      onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                      required
                      disabled={contactState === 'loading'}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="contact-message" className="form-label">
                      <i className="fa-light fa-sharp fa-message" /> Message
                    </label>
                    <textarea
                      id="contact-message"
                      className="form-textarea"
                      placeholder="Tell us what you need…"
                      value={contactForm.message}
                      onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                      required
                      disabled={contactState === 'loading'}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={contactState === 'loading'}
                  >
                    {contactState === 'loading'
                      ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Sending…</>
                      : <><i className="fa-light fa-sharp fa-paper-plane" /> Send Message</>
                    }
                  </button>
                </form>
              )}
            </div>

            {/* Info panel */}
            <ScrollReveal from="right">
              <div className="contact__info">
                <h3 className="contact__info-title">Himalix Labs</h3>
                <p className="contact__info-desc">
                  We're based in Kathmandu and serve clients across Nepal. Reach out for any inquiry.
                </p>
                <div className="contact__info-items">
                  {[
                    { icon: 'location-dot', label: 'Address', value: content?.content?.contact?.address || 'Kathmandu, Nepal' },
                    { icon: 'envelope', label: 'Email', value: content?.content?.contact?.email || 'info@himalixlabs.com' },
                    { icon: 'phone', label: 'Phone', value: content?.content?.contact?.phone || '+977-9800000000' }
                  ].map(item => (
                    <div key={item.label} className="contact__info-item">
                      <i className={`fa-light fa-sharp fa-${item.icon}`} />
                      <div>
                        <div className="contact__info-label">{item.label}</div>
                        <div className="contact__info-value">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

/* ── Default fallback data ── */
const serviceSteps = [
  [
    { title: '1. Browse & Add', desc: 'Select from hundreds of verified microcontrollers, modules, and parts.' },
    { title: '2. Pinpoint Delivery Map', desc: 'Mark your coordinates on our Leaflet map to set your location.' },
    { title: '3. Wallet Checkout', desc: 'Deduct payments securely from your pre-loaded wallet credit.' },
    { title: '4. Express Transit', desc: 'Monitor your delivery progress and real-time distance calculations.' }
  ],
  [
    { title: '1. Upload Mesh Model', desc: 'Upload STL or OBJ files through our visual printing gateway.' },
    { title: '2. Select Print Specs', desc: 'Choose material type, infill density, layer height, and coloring.' },
    { title: '3. Instant Weight Quote', desc: 'Our backend determines layer volumes to generate clear pricing.' },
    { title: '4. Print & Handover', desc: 'Kathmandu HQ prints your prototype and dispatches it directly.' }
  ],
  [
    { title: '1. Select Stack Scope', desc: 'Specify project target framework (React, Next.js, Next/Laravel).' },
    { title: '2. Choose Budget Bucket', desc: 'Match your needs against budget tiers to define timeline resources.' },
    { title: '3. Create Design Inquiry', desc: 'Submit specifications to set up a secure communications channel.' },
    { title: '4. Track Revisions', desc: 'Follow designer commits, approve iterations, and inspect revisions.' }
  ],
  [
    { title: '1. Search Technical Kit', desc: 'Browse available IoT prototypes, DIY setups, and codes.' },
    { title: '2. Purchase or Rent', desc: 'Select buy to own complete parts, or rent for short-term lab work.' },
    { title: '3. Accept Academic EULA', desc: 'Confirm integrity guidelines and return damage terms.' },
    { title: '4. Return & Refund', desc: 'Deliver rented parts back to Kathmandu HQ to release your deposit.' }
  ]
];

const defaultHero = {};

const defaultServices = [
  { id: 1, icon: 'store', title: 'Himalix Store', description: 'Quality electronics, gadgets, and tech accessories delivered across Nepal.', features: ['Wide product catalog', 'Wallet & referral system', 'Order tracking', 'Express delivery'], link: '/store', cta: 'Shop Now' },
  { id: 2, icon: 'cube', title: 'Himalix 3D', description: 'Professional FDM and resin 3D printing for prototypes, parts, and art pieces.', features: ['FDM & resin printing', 'Custom filament colors', 'Design assistance', 'Bulk orders'], link: '/3d', cta: 'Order Prints' },
  { id: 3, icon: 'globe', title: 'Himalix Web', description: 'Modern websites and web applications for businesses across Nepal.', features: ['Custom design', 'React / Next.js', 'E-commerce setup', 'SEO optimization'], link: '/web', cta: 'Request Website' },
  { id: 4, icon: 'code', title: 'Himalix Projects', description: 'Custom software, Arduino prototypes, Raspberry Pi builds, and IoT systems.', features: ['Embedded systems', 'Mobile apps', 'API integrations', 'Consulting'], link: '/project', cta: 'Explore Projects' },
];

const defaultAbout = {
  title: "Built for Nepal's tech future.",
  description: "Himalix Labs is a Kathmandu-based technology company delivering quality electronics, 3D printing, web solutions, and custom software — all from one place.",
};

const defaultPillars = [
  { icon: 'shield-check', title: 'Quality First', text: 'Every product and service is vetted for quality before reaching you.' },
  { icon: 'bolt', title: 'Speed & Reliability', text: 'Fast delivery, real-time tracking, and guaranteed service timelines.' },
  { icon: 'headset', title: 'Direct Support', text: 'Talk to real people — no bots, no generic helpdesks.' },
];

const defaultStats = [
  { icon: 'users', value: 500, suffix: '+', label: 'Happy Customers' },
  { icon: 'box', value: 1200, suffix: '+', label: 'Orders Delivered' },
  { icon: 'cube', value: 300, suffix: '+', label: '3D Prints Completed' },
  { icon: 'star', value: 4, suffix: '.9★', label: 'Average Rating' },
];

const defaultTeam = [
  { id: 1, name: 'Zenith Kandel', role: 'Founder & CEO', bio: 'Building technology solutions that make Nepal\'s digital future accessible to everyone.' },
];

const defaultTestimonials = [
  { name: 'Rohan Shrestha', title: 'Kathmandu', rating: 5, text: 'Ordered a microcontroller kit — arrived in 2 days, perfectly packaged. Himalix Store is now my go-to.' },
  { name: 'Priya Tamang', title: 'Lalitpur', rating: 5, text: 'Got a custom 3D-printed enclosure for my project. The quality exceeded my expectations.' },
];

const aboutTags = [
  { icon: 'microchip', label: 'Electronics', style: { top: '15%', left: '10%' } },
  { icon: 'cube', label: '3D Printing', style: { top: '30%', right: '8%' } },
  { icon: 'globe', label: 'Web Dev', style: { top: '55%', left: '15%' } },
  { icon: 'code', label: 'IoT & Software', style: { top: '70%', right: '12%' } },
  { icon: 'truck-fast', label: 'Fast Delivery', style: { bottom: '12%', left: '25%' } },
];
