// The Entry Makers build: "Support & About" page.
// (Copied over the upstream file by scripts/rebrand.mjs.)
// Keeps the upstream What's New, Problem Log and privacy sections, and the
// MIT credit to the original authors.
import { createElement } from 'react';
import { Mail, Phone, Globe } from 'lucide-react';
import brand from '../../brand/brand.json';
import WhatsNew from './WhatsNew';
import ProblemLog from './ProblemLog';
import { SafePrivateSection } from './SafePrivateNote';

export default function SupportView() {
  const card = { padding: '1.25rem 1.5rem' };
  const contacts = [
    brand.contactEmail && { icon: Mail, text: brand.contactEmail, href: `mailto:${brand.contactEmail}` },
    brand.contactPhone && { icon: Phone, text: brand.contactPhone, href: `tel:${brand.contactPhone.replace(/\s+/g, '')}` },
    brand.website && { icon: Globe, text: brand.website.replace(/^https?:\/\//, ''), href: brand.website },
  ].filter(Boolean);

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Support &amp; About</h1>
          <p className="page-subtitle">{brand.appName} {brand.tagline}</p>
        </div>
      </div>

      <div className="glass-panel" style={{ ...card, marginBottom: '1.25rem', display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <img src="/brand-logo.png" alt={brand.company} style={{ height: 72, width: 'auto', background: '#fff', borderRadius: 10, padding: 6 }} />
        <div style={{ flex: '1 1 260px' }}>
          <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.05rem' }}>{brand.company}</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '70ch' }}>
            Your invoices and books stay on this computer. For help, setup or training, contact {brand.company}.
          </p>
          {contacts.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              {contacts.map((c) => (
                <a key={c.href} className="btn btn-secondary" href={c.href} target="_blank" rel="noopener noreferrer">{createElement(c.icon, { size: 16 })} {c.text}</a>
              ))}
            </div>
          )}
        </div>
      </div>

      <WhatsNew />
      <ProblemLog />
      <SafePrivateSection />

      <p style={{ marginTop: '1.5rem', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        Based on <a href={brand.upstream.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>{brand.upstream.name}</a> by {brand.upstream.author}, used under the MIT License.
      </p>
    </div>
  );
}
