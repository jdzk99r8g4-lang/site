import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { brand } from '@/lib/brand';

const title = `${brand.name} — ${brand.shortTagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: {
    default: title,
    template: `%s — ${brand.name}`,
  },
  description: brand.metaDescription,
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: brand.name,
    title,
    description: brand.metaDescription,
  },
  robots: {
    /*
     * Le site ne doit PAS être indexé avant que les mentions légales portent
     * une identité juridique réelle et que la durée de conservation des
     * journaux de l'hébergeur ait été confirmée. Passer
     * NEXT_PUBLIC_ALLOW_INDEXING à « true » ce jour-là, et pas avant :
     * une page légale incomplète indexée est pire qu'une page absente.
     */
    index: process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true',
    follow: process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#141413',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {/* Lien d'évitement : première chose atteinte au clavier. */}
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-bg"
        >
          Aller au contenu
        </a>
        <Header />
        <div id="contenu">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
