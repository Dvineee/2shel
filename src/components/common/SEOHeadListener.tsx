import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../../context/DataContext';

const BASE_CANONICAL_DOMAIN = 'https://shelbyonline.com';

export function SEOHeadListener() {
  const location = useLocation();
  const { settings, activeSponsors } = useData();

  useEffect(() => {
    try {
      const pathname = location.pathname;
      const cleanPath = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;

      // 1. Calculate Canonical URL
      const canonicalUrl = cleanPath === '/' ? `${BASE_CANONICAL_DOMAIN}/` : `${BASE_CANONICAL_DOMAIN}${cleanPath}`;

      // Update or create canonical link tag
      let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.setAttribute('rel', 'canonical');
        document.head.appendChild(linkCanonical);
      }
      linkCanonical.setAttribute('href', canonicalUrl);

      // 2. Resolve Page-Specific Title and Description
      const siteBrand = settings.site_name || 'Shelby Online';
      let pageTitle = settings.site_title || 'Shelby Online | Güncel Kampanyalar';
      let pageDesc =
        settings.meta_description ||
        settings.site_description ||
        'Shelby Online ile güncel kampanyaları, sponsorları, ödülleri ve fırsatları keşfedin.';

      if (cleanPath === '/') {
        pageTitle = settings.site_title || 'Shelby Online | Güncel Kampanyalar';
        pageDesc =
          settings.meta_description ||
          settings.site_description ||
          'Shelby Online ile güncel kampanyaları, sponsorları, ödülleri ve fırsatları keşfedin.';
      } else if (cleanPath === '/sponsors') {
        pageTitle = `Güvenilir Sponsorlar & Bonuslar | ${siteBrand}`;
        pageDesc = 'Doğrulanmış ve güvenilir sponsor sitelerinin en yüksek bonus ve kampanyalarını inceleyin.';
      } else if (cleanPath.startsWith('/site/') || cleanPath.startsWith('/sponsors/')) {
        const slug = cleanPath.replace(/^\/(site|sponsors)\//, '');
        const matchedSponsor = activeSponsors?.find(
          (s) => (s.slug && s.slug.toLowerCase() === slug.toLowerCase()) || (s.id && s.id === slug)
        );
        if (matchedSponsor) {
          pageTitle = `${matchedSponsor.name} Giriş & Detaylı İnceleme | ${siteBrand}`;
          pageDesc = matchedSponsor.description
            ? `${matchedSponsor.name} - ${matchedSponsor.description}`
            : `${matchedSponsor.name} güncel giriş adresi, bonusları ve kullanıcı avantajları.`;
        } else {
          pageTitle = `Sponsor İncelemesi | ${siteBrand}`;
        }
      } else if (cleanPath === '/wheel') {
        pageTitle = `Günlük Şans Çarkı | ${siteBrand}`;
        pageDesc = 'Her gün ücretsiz şans çarkını çevirin, nakit bonus ve özel hediyeler kazanın.';
      } else if (cleanPath === '/giveaways') {
        pageTitle = `Özel Çekilişler & Hediyeler | ${siteBrand}`;
        pageDesc = 'Büyük ödüllü topluluk çekilişlerine katılın, muhteşem hediyeleri kazanma şansı yakalayın.';
      } else if (cleanPath === '/store') {
        pageTitle = `Ödül Mağazası | ${siteBrand}`;
        pageDesc = 'Kazandığınız puan ve coinlerle mağazadan dilediğiniz ödülü anında satın alın.';
      } else if (cleanPath === '/leaderboard') {
        pageTitle = `Liderlik Tablosu | ${siteBrand}`;
        pageDesc = 'En çok kazanan kullanıcılar ve haftalık sıralama tablosu.';
      } else if (cleanPath === '/games/mines') {
        pageTitle = `Shelby Mines - Mayın Tarlası Oyunu | ${siteBrand}`;
        pageDesc = 'Mayınlara basmadan güvenli elmas kutularını açın, çarpanları katlayın ve kazancınızı nakit coin olarak çekin!';
      } else if (cleanPath === '/games') {
        pageTitle = `Oyunlar & Eğlence | ${siteBrand}`;
        pageDesc = 'Shelby Online özel mini oyunları ile eğlenin ve coin kazanın.';
      } else if (cleanPath === '/live') {
        pageTitle = `Canlı TV & Maç Yayınları | ${siteBrand}`;
        pageDesc = 'Kesintisiz canlı maç yayınları ve spor karşılaşmaları.';
      } else if (cleanPath === '/about') {
        pageTitle = `Hakkımızda | ${siteBrand}`;
        pageDesc = 'Shelby Online hakkında detaylı bilgi, vizyonumuz ve güvenilirlik standartlarımız.';
      } else if (cleanPath === '/contact') {
        pageTitle = `İletişim & Reklam | ${siteBrand}`;
        pageDesc = 'Bizimle iletişime geçin, sponsorluk ve reklam taleplerinizi iletin.';
      } else if (cleanPath === '/login') {
        pageTitle = `Giriş Yap | ${siteBrand}`;
        pageDesc = 'Telegram ile tek tıkla şifresiz ve güvenli giriş yapın.';
      } else if (cleanPath === '/register') {
        pageTitle = `Kayıt Ol | ${siteBrand}`;
        pageDesc = 'Shelby Online topluluğuna katılın ve hoş geldin bonuslarını toplayın.';
      } else if (cleanPath === '/profile') {
        pageTitle = `Profilim | ${siteBrand}`;
      } else if (cleanPath.startsWith('/admin')) {
        pageTitle = `Yönetim Paneli | ${siteBrand}`;
        pageDesc = 'Shelby Online Yönetim ve CMS Paneli';
      }

      // Update Document Title
      document.title = pageTitle;

      // Update Meta Description
      let metaDescTag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!metaDescTag) {
        metaDescTag = document.createElement('meta');
        metaDescTag.setAttribute('name', 'description');
        document.head.appendChild(metaDescTag);
      }
      metaDescTag.setAttribute('content', pageDesc);

      // Update Open Graph Tags
      const setMetaProperty = (prop: string, val: string) => {
        let tag = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement | null;
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute('property', prop);
          document.head.appendChild(tag);
        }
        tag.setAttribute('content', val);
      };

      const setMetaName = (name: string, val: string) => {
        let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute('name', name);
          document.head.appendChild(tag);
        }
        tag.setAttribute('content', val);
      };

      setMetaProperty('og:url', canonicalUrl);
      setMetaProperty('og:title', pageTitle);
      setMetaProperty('og:description', pageDesc);
      setMetaProperty('og:site_name', siteBrand);
      setMetaName('twitter:title', pageTitle);
      setMetaName('twitter:description', pageDesc);

      // Set Robots Meta (Admin pages are noindex)
      let robotsTag = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
      if (!robotsTag) {
        robotsTag = document.createElement('meta');
        robotsTag.setAttribute('name', 'robots');
        document.head.appendChild(robotsTag);
      }
      if (cleanPath.startsWith('/admin')) {
        robotsTag.setAttribute('content', 'noindex, nofollow');
      } else {
        robotsTag.setAttribute('content', 'index, follow');
      }

      // Optional Google Site Verification if configured
      const gVerify = (import.meta as any).env?.VITE_GOOGLE_SITE_VERIFICATION || settings.google_site_verification;
      if (gVerify && typeof gVerify === 'string' && gVerify.trim()) {
        setMetaName('google-site-verification', gVerify.trim());
      }
    } catch {
      // Non-blocking fallback
    }
  }, [location.pathname, location.search, settings, activeSponsors]);

  return null;
}
