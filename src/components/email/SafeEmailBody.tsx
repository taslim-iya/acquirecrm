import { useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'dompurify';

interface SafeEmailBodyProps {
  html?: string | null;
  textFallback?: string | null;
  className?: string;
}

const escapeHtml = (s: string): string =>
  s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);

/**
 * Renders untrusted email HTML in a sandboxed iframe. The HTML is first
 * sanitized with DOMPurify (no scripts, no event handlers, no javascript:
 * URLs) and then handed to an iframe that has `allow-scripts` and
 * `allow-same-origin` deliberately omitted, so even if a payload slipped
 * through sanitization it could not execute or read parent state.
 */
export const SafeEmailBody = ({ html, textFallback, className }: SafeEmailBodyProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(200);

  const srcDoc = useMemo(() => {
    const sanitized = html
      ? DOMPurify.sanitize(html, {
          USE_PROFILES: { html: true },
          FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'base'],
          FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'srcdoc'],
          ALLOW_DATA_ATTR: false,
        })
      : '';

    const body =
      sanitized ||
      (textFallback ? escapeHtml(textFallback).replace(/\n/g, '<br>') : '');

    return `<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><style>
      :root { color-scheme: light; }
      html, body { margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif;
        font-size: 14px; line-height: 1.55; color: #1d1d1f; background: transparent;
        -webkit-font-smoothing: antialiased;
      }
      img, video { max-width: 100%; height: auto; }
      a { color: #0071e3; text-decoration: none; }
      a:hover { text-decoration: underline; }
      blockquote { border-left: 3px solid #d2d2d7; margin: 0; padding: 0 12px; color: #6e6e73; }
      pre, code { font-family: ui-monospace, "SF Mono", Menlo, monospace; }
      table { max-width: 100%; }
    </style></head><body>${body}</body></html>`;
  }, [html, textFallback]);

  useEffect(() => {
    const frame = iframeRef.current;
    if (!frame) return;
    const onLoad = () => {
      try {
        const doc = frame.contentDocument;
        if (!doc) return;
        const measured = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight);
        setHeight(measured + 16);
      } catch {
        // Cross-origin or detached document — keep the current height.
      }
    };
    frame.addEventListener('load', onLoad);
    return () => frame.removeEventListener('load', onLoad);
  }, [srcDoc]);

  return (
    <iframe
      ref={iframeRef}
      title="Email content"
      // Note: NO `allow-scripts` and NO `allow-same-origin` — the rendered
      // content is treated as a separate, scriptless origin.
      sandbox="allow-popups allow-popups-to-escape-sandbox"
      srcDoc={srcDoc}
      className={className}
      style={{ width: '100%', border: 'none', height, background: 'transparent' }}
    />
  );
};
