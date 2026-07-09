import React from 'react';

export default function HeroContentEditor({ cmsContent, loading, saving, message, onSave }) {
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}><div className="spinner" /></div>;
  }

  return (
    <div className="cms-general-editor">
      <h2 className="admin-view-title">Hero & Content Customization</h2>

      {message && <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>{message}</div>}

      <form onSubmit={async (e) => {
        e.preventDefault();
        await onSave('hero', {
          title_before: e.target.title_before.value,
          title_em: e.target.title_em.value,
          title_after: e.target.title_after.value,
          subtitle: e.target.subtitle.value,
        });
        await onSave('about', {
          title: e.target.about_title.value,
          description: e.target.about_desc.value,
        });
        await onSave('contact', {
          email: e.target.contact_email.value,
          phone: e.target.contact_phone.value,
          address: e.target.contact_address.value,
        });
        await onSave('footer', {
          footer_description: e.target.footer_desc.value,
          footer_copyright: e.target.footer_copy.value,
        });
      }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '800px' }}>

        {/* 1. Hero Banner */}
        <div style={{ background: 'var(--bg-secondary)', padding: 'var(--space-4)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: 'var(--text-md)', marginBottom: 'var(--space-4)', color: 'var(--accent)', fontWeight: 600 }}>1. Hero Banner</h3>
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Title Prefix</label>
              <input name="title_before" defaultValue={cmsContent.hero?.title_before || ''} className="form-input" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Highlighted Word</label>
              <input name="title_em" defaultValue={cmsContent.hero?.title_em || ''} className="form-input" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Title Suffix</label>
              <input name="title_after" defaultValue={cmsContent.hero?.title_after || ''} className="form-input" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Subtitle</label>
            <textarea name="subtitle" defaultValue={cmsContent.hero?.subtitle || ''} className="form-textarea" style={{ minHeight: '60px' }} />
          </div>
        </div>

        {/* 2. About */}
        <div style={{ background: 'var(--bg-secondary)', padding: 'var(--space-4)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: 'var(--text-md)', marginBottom: 'var(--space-4)', color: 'var(--accent)', fontWeight: 600 }}>2. About Labs</h3>
          <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
            <label className="form-label">Section Title</label>
            <input name="about_title" defaultValue={cmsContent.about?.title || ''} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea name="about_desc" defaultValue={cmsContent.about?.description || ''} className="form-textarea" style={{ minHeight: '80px' }} />
          </div>
        </div>

        {/* 3. Contact */}
        <div style={{ background: 'var(--bg-secondary)', padding: 'var(--space-4)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: 'var(--text-md)', marginBottom: 'var(--space-4)', color: 'var(--accent)', fontWeight: 600 }}>3. Contact Info</h3>
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Helpline Email</label>
              <input name="contact_email" type="email" defaultValue={cmsContent.contact?.email || ''} className="form-input" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Helpline Phone</label>
              <input name="contact_phone" defaultValue={cmsContent.contact?.phone || ''} className="form-input" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">HQ Address</label>
            <input name="contact_address" defaultValue={cmsContent.contact?.address || ''} className="form-input" />
          </div>
        </div>

        {/* 4. Footer */}
        <div style={{ background: 'var(--bg-secondary)', padding: 'var(--space-4)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: 'var(--text-md)', marginBottom: 'var(--space-4)', color: 'var(--accent)', fontWeight: 600 }}>4. Footer</h3>
          <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
            <label className="form-label">Short Description</label>
            <input name="footer_desc" defaultValue={cmsContent.footer?.footer_description || ''} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Copyright Text</label>
            <input name="footer_copy" defaultValue={cmsContent.footer?.footer_copyright || ''} className="form-input" />
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end mt-4">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <><i className="fa-light fa-sharp fa-spinner-third fa-spin" style={{ marginRight: 6 }} /> Saving...</>
            ) : (
              <><i className="fa-light fa-sharp fa-floppy-disk" style={{ marginRight: 6 }} /> Save All Content</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
