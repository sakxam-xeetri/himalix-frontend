import React from 'react';
import { Link } from 'react-router-dom';
import StoreFooter from './Footer';

export default function Terms() {
  return (
    <div className="store-page">
      <div className="store-layout" style={{ maxWidth: 800, margin: '0 auto', padding: 'var(--space-8) var(--space-4)' }}>
        <div className="page-header" style={{ marginBottom: 'var(--space-8)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-4)' }}>
          <h1 className="page-title">Terms & Conditions of Service</h1>
          <p className="page-subtitle" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)' }}>Last Updated: June 2026</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', fontSize: '13px', color: 'var(--text-1)', lineHeight: 1.8 }}>
          
          <section>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-0)', marginBottom: 'var(--space-2)' }}>
              1. Acceptance of Terms & Services
            </h2>
            <p>
              By accessing, browsing, registering, or purchasing products, kits, templates, custom software code, or physical services from Himalix Labs ("Company", "we", "us", "our"), you ("User", "Customer", "Licensee") agree to be legally bound by these Terms and Conditions. If you do not agree with any part of these terms, you must immediately cease all access and use of the platform.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-0)', marginBottom: 'var(--space-2)' }}>
              2. Purchasing, Transaction, and Store Wallets
            </h2>
            <p>
              All purchases and orders placed through Himalix Labs are subject to product availability. Wallet credits and promotional balances earned via referrals or social invitation challenges are non-transferable, non-refundable, and hold no physical cash value. Himalix Labs reserves the right to freeze, audit, or invalidate customer wallet balances or user accounts suspected of fraudulent activity, exploitation of referral loops, or automated scraping.
            </p>
          </section>

          <section style={{ backgroundColor: 'rgba(212, 160, 23, 0.05)', borderLeft: '4px solid var(--warning)', padding: 'var(--space-4)' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--warning)', marginBottom: 'var(--space-2)' }}>
              3. Academic Integrity, Project Misuse & Plagiarism Disclaimer
            </h2>
            <p style={{ fontWeight: 500, color: 'var(--text-0)' }}>
              IMPORTANT ACADEMIC COMPLIANCE NOTICE FOR STUDENTS, INSTRUCTORS, AND EDUCATIONAL USERS:
            </p>
            <p style={{ marginTop: 'var(--space-2)' }}>
              All project documentation, design plans, electrical circuits, source code, and physical component prototypes provided in the tech projects section are sold and licensed strictly as <strong>educational references, conceptual templates, and developmental prototyping kits</strong>. 
            </p>
            <p style={{ marginTop: 'var(--space-2)' }}>
              Himalix Labs explicitly prohibits, condemns, and disclaims any and all responsibility for academic fraud, plagiarism, or intellectual dishonesty. Under no circumstances may a User submit, present, or claim any project, codebase, or design provided by Himalix Labs to any school, college, university, competition, science fair, or external assessment as their own original work. 
            </p>
            <p style={{ marginTop: 'var(--space-2)' }}>
              If a User chooses to misrepresent, plagiarize, or misuse Himalix Labs products or source codes in an academic or assessment setting, the User assumes <strong>100% of the liability</strong>. Himalix Labs, its parent entities, founders, and developers shall not be held liable or responsible for any academic disciplinary actions, expulsions, grade reductions, disqualifications, or legal disputes resulting from the User's academic dishonesty.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-0)', marginBottom: 'var(--space-2)' }}>
              4. Physical Assembly & Electrical Component Safety Disclaimer
            </h2>
            <p>
              Many products, DIY component kits, and custom 3D printed parts sold through Himalix Labs involve raw electronics, soldering irons, lithium batteries, and electrical currents. The Customer acknowledges that handling electronics components, raw circuitry, and batteries carries inherent risks of short circuits, burns, fires, and electric shock. Himalix Labs assumes zero liability for physical injury, medical emergencies, property destruction, or equipment damage arising from the assembly, configuration, use, or misuse of purchased electronics components.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-0)', marginBottom: 'var(--space-2)' }}>
              5. Warranties & "AS IS" Disclaimers
            </h2>
            <p>
              ALL COMPONENT KITS, CUSTOM DESIGN PROJECTS, STL FILAMENT SPECIFICATIONS, AND PLATFORM SOFTWARE CODE ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. TO THE FULLEST EXTENT PERMISSIBLE BY APPLICABLE LAW, HIMALIX LABS DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT PRODUCT WORKFLOWS, 3D PRINTS, OR SOFTWARE SCRIPTS WILL BE FREE OF DEVIATIONS, CORRUPTIONS, ACCURACY ERRORS, OR TECHNICAL INTERRUPTIONS.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-0)', marginBottom: 'var(--space-2)' }}>
              6. Limitation of Liability & Indemnification
            </h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL HIMALIX LABS, ITS DIRECTORS, SHAREHOLDERS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, SPECIAL, INCIDENTAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES (INCLUDING LOSS OF PROFITS, DATA, USE, OR GOODWILL) ARISING OUT OF OR IN CONNECTION WITH THE SERVICES, REGARDLESS OF THE CAUSE OF ACTION. HIMALIX LABS' TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF THESE TERMS SHALL NOT EXCEED THE TOTAL AMOUNT ACTUALLY PAID BY THE CUSTOMER TO HIMALIX LABS FOR THE SPECIFIC TRANSACTION GIVING RISE TO THE DISPUTE.
            </p>
            <p style={{ marginTop: 'var(--space-2)' }}>
              The Customer agrees to indemnify, defend, and hold harmless Himalix Labs and its founders from any third-party claims, legal actions, losses, or liabilities (including legal fees) arising from the Customer's violation of these terms or misuse of platform files.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-0)', marginBottom: 'var(--space-2)' }}>
              7. Governing Law & Dispute Resolution
            </h2>
            <p>
              These Terms & Conditions and all relations between Himalix Labs and its Customers shall be governed by, construed, and enforced in accordance with the laws of Nepal. Any dispute, litigation, or claim arising from these Terms shall be subject to the exclusive jurisdiction of the district courts of Kathmandu, Nepal.
            </p>
          </section>

        </div>

        <div style={{ marginTop: 'var(--space-10)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--border)' }}>
          <Link to="/store" className="btn btn-outline" style={{ borderRadius: '0px' }}>
            <i className="fa-light fa-sharp fa-arrow-left" style={{ marginRight: '6px' }} /> Return to storefront
          </Link>
        </div>
      </div>
      <StoreFooter />
    </div>
  );
}
