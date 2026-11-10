// The Entry Makers build: the small line at the end of the Dashboard.
// (Copied over the upstream file by scripts/rebrand.mjs.)
import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import brand from '../../brand/brand.json';

export default function AppFooter({ onOpenSupport }) {
  const [version, setVersion] = useState('');
  useEffect(() => {
    let live = true;
    fetch('/api/version').then((r) => r.json()).then((d) => { if (live && d?.current) setVersion(d.current); }).catch(() => {});
    return () => { live = false; };
  }, []);
  const link = { color: 'inherit', textDecoration: 'none', fontWeight: 600 };
  return (
    <footer style={{ marginTop: 'auto', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', justifyContent: 'center',
        padding: '0.3rem 0.85rem', borderRadius: 999, background: 'var(--card-bg)', border: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
      }}>
        <span>{brand.appName} {brand.tagline}{version ? ` v${version}` : ''}</span>
        <span aria-hidden="true">·</span>
        <button type="button" onClick={onOpenSupport}
          style={{ ...link, background: 'none', border: 0, padding: 0, font: 'inherit', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <Info size={11} /> About
        </button>
      </span>
    </footer>
  );
}
