import React from 'react';
import { Link } from 'react-router-dom';
import StoreFooter from './Footer';

export default function Eula() {
  return (
    <div className="store-page">
      <div className="store-layout" style={{ maxWidth: 800, margin: '0 auto', padding: 'var(--space-8) var(--space-4)' }}>
        <div className="page-header" style={{ marginBottom: 'var(--space-8)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-4)' }}>
          <h1 className="page-title">End User License Agreement (EULA)</h1>
          <p className="page-subtitle" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)' }}>Last Updated: June 2026</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', fontSize: '13px', color: 'var(--text-1)', lineHeight: 1.8 }}>
          
          <section>
            <p>
              This End User License Agreement ("EULA") is a binding legal contract between you ("Licensee" or "User") and Himalix Labs ("Licensor" or "Company") governing your use of Himalix Labs' software, database services, source code files, schematic diagrams, STL files for 3D printing, custom designs, and educational project materials (collectively referred to as "Licensed Materials").
            </p>
            <p style={{ marginTop: 'var(--space-2)', fontWeight: 600, color: 'var(--text-0)' }}>
              PLEASE READ THIS EULA CAREFULLY BEFORE DOWNLOADING, ACCESSING, OR UTILIZING ANY MATERIALS FROM HIMALIX LABS. BY DOWNLOADING OR ACCESSING THE MATERIALS, YOU AGREE TO BE BOUND BY THE TERMS OF THIS AGREEMENT.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-0)', marginBottom: 'var(--space-2)' }}>
              1. Grant of License
            </h2>
            <p>
              Subject to your strict compliance with the terms of this EULA and payment of any applicable fees, Licensor grants you a personal, limited, non-exclusive, non-transferable, revocable, and non-sublicensable license to download, view, and use the Licensed Materials solely for your personal, educational, non-commercial research, and prototyping reference purposes.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-0)', marginBottom: 'var(--space-2)' }}>
              2. License Restrictions
            </h2>
            <p>
              You agree NOT to, and will not permit others to:
            </p>
            <ul style={{ paddingLeft: 'var(--space-6)', listStyleType: 'disc', marginTop: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>License, sell, rent, lease, assign, distribute, transmit, host, outsource, disclose or otherwise commercially exploit the Licensed Materials.</li>
              <li>Modify, make derivative works of, disassemble, decrypt, reverse compile or reverse engineer any part of the software code, circuits, or schematics.</li>
              <li>Remove, alter, or obscure any proprietary copyright notices or trademarks on the designs or files.</li>
              <li>Use the Licensed Materials for any illegal purposes or activities.</li>
            </ul>
          </section>

          <section style={{ backgroundColor: 'rgba(219, 68, 85, 0.05)', borderLeft: '4px solid var(--danger)', padding: 'var(--space-4)' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--danger)', marginBottom: 'var(--space-2)' }}>
              3. Prohibition of Academic Plagiarism & Submission Misuse
            </h2>
            <p style={{ fontWeight: 500, color: 'var(--text-0)' }}>
              PROHIBITED ACADEMIC PLAGIARISM WARNING:
            </p>
            <p style={{ marginTop: 'var(--space-2)' }}>
              The license granted under this EULA strictly prohibits academic plagiarism. You are expressly forbidden from submitting any Licensed Materials (including custom code, schematic circuit drawings, project blueprints, or finished 3D printed objects) to schools, colleges, universities, or academic institutions as your own original work. 
            </p>
            <p style={{ marginTop: 'var(--space-2)' }}>
              The Licensed Materials are reference tools and parts kits intended to aid learning and conceptual prototyping. Himalix Labs owners, developers, and partners bear absolutely no responsibility for any academic discipline, grade adjustments, disqualifications, expulsions, or legal liabilities you may incur due to violating your institution's academic integrity policies.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-0)', marginBottom: 'var(--space-2)' }}>
              4. Disclaimer of Warranties
            </h2>
            <p>
              THE LICENSED MATERIALS ARE PROVIDED TO YOU "AS IS" AND "AS AVAILABLE" AND WITH ALL FAULTS AND DEFECTS WITHOUT WARRANTY OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED UNDER APPLICABLE LAW, LICENSOR EXPRESSLY DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, STATUTORY OR OTHERWISE, INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE AND NON-INFRINGEMENT. HIMALIX LABS DOES NOT WARRANT THAT THE OPERATION OF SOFTWARE SCRIPTS, CIRCUITRY, OR 3D PRINTS WILL BE FAIL-SAFE, ERROR-FREE, OR UNINTERRUPTED.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-0)', marginBottom: 'var(--space-2)' }}>
              5. Limitation of Liability
            </h2>
            <p>
              UNDER NO CIRCUMSTANCES SHALL HIMALIX LABS OR ITS FOUNDERS BE LIABLE FOR ANY INDIRECT, SPECIAL, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR EXEMPLARY DAMAGES (INCLUDING PROPERTY DAMAGE, PERSONAL INJURY, LOSS OF PROFITS, BUSINESS INTERRUPTION, OR LOSS OF INFORMATION) ARISING OUT OF THE USE OF OR INABILITY TO USE THE LICENSED MATERIALS, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
            </p>
            <p style={{ marginTop: 'var(--space-2)' }}>
              IN NO EVENT SHALL HIMALIX LABS' TOTAL LIABILITY TO YOU FOR ALL DAMAGES EXCEED THE ACTUAL VALUE PAID BY YOU FOR THE INDIVIDUAL LICENSE GIVING RISE TO THE APPLICABLE CLAIM.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-0)', marginBottom: 'var(--space-2)' }}>
              6. Term and Termination
            </h2>
            <p>
              This Agreement shall remain in effect until terminated by you or Licensor. Licensor may, in its sole discretion, at any time and for any or no reason, suspend or terminate this EULA and your license to the Licensed Materials with or without prior notice. Upon termination, you must immediately destroy all downloaded Licensed Materials in your possession.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-0)', marginBottom: 'var(--space-2)' }}>
              7. Entire Agreement & Governing Law
            </h2>
            <p>
              This EULA constitutes the entire agreement between the parties concerning this license and is governed by the laws of Nepal, without regard to its conflict of law principles. Any dispute arising under this Agreement shall be brought exclusively in the Kathmandu district courts.
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
