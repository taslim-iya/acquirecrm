import { useEffect } from 'react';
import { useBrandSettings } from '@/hooks/useBrandSettings';

/**
 * Dynamically updates <head> tags (title, meta, favicon, OG, Twitter)
 * based on brand settings. Renders nothing visually.
 */
export function BrandHeadTags() {
  const { settings, getSiteTitle, getMetaDescription, getAsset } = useBrandSettings();

  useEffect(() => {
    // Title
    document.title = getSiteTitle();

    // Meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', getMetaDescription());

    // Favicon
    const faviconUrl = getAsset('favicon_url');
    if (faviconUrl) {
      let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }

    // Apple touch icon
    const appleIconUrl = getAsset('apple_touch_icon_url');
    if (appleIconUrl) {
      let link = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'apple-touch-icon';
        document.head.appendChild(link);
      }
      link.href = appleIconUrl;
    }

    // OG tags
    const ogTitle = settings?.og_title || getSiteTitle();
    const ogDesc = settings?.og_description || getMetaDescription();
    const ogImage = getAsset('og_image_url');

    setMetaTag('og:title', ogTitle);
    setMetaTag('og:description', ogDesc);
    if (ogImage) setMetaTag('og:image', ogImage);

    // Twitter tags
    const twitterTitle = settings?.twitter_title || ogTitle;
    const twitterDesc = settings?.twitter_description || ogDesc;
    const twitterImage = getAsset('twitter_image_url') || ogImage;

    setMetaTag('twitter:title', twitterTitle);
    setMetaTag('twitter:description', twitterDesc);
    if (twitterImage) setMetaTag('twitter:image', twitterImage);
  }, [settings, getSiteTitle, getMetaDescription, getAsset]);

  return null;
}

function setMetaTag(property: string, content: string) {
  const isOg = property.startsWith('og:');
  const selector = isOg
    ? `meta[property="${property}"]`
    : `meta[name="${property}"]`;
  let el = document.querySelector(selector) as HTMLMetaElement;
  if (!el) {
    el = document.createElement('meta');
    if (isOg) el.setAttribute('property', property);
    else el.setAttribute('name', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}
