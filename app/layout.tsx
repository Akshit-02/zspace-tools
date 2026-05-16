import type { Metadata } from 'next';
import './globals.css';
import Header from './components/Header';
import Footer from './components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL('https://tools.zspace.in'),
  title: {
    default: 'ZSpace Tools — Free Online Tools for Business & Finance',
    template: '%s | ZSpace Tools',
  },
  description:
    'ZSpace Tools offers free, fast, and accurate online calculators and tools for GST, tax, finance, SEO, and more — built for Indian businesses.',
  keywords: [
    'free online tools',
    'GST calculator',
    'tax calculator India',
    'business tools',
    'finance calculator',
    'ZSpace',
  ],
  authors: [{ name: 'ZSpace', url: 'https://tools.zspace.in' }],
  creator: 'ZSpace',
  publisher: 'ZSpace',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://tools.zspace.in',
    siteName: 'ZSpace Tools',
    title: 'ZSpace Tools — Free Online Tools for Business & Finance',
    description: 'Free, fast, and accurate online calculators built for Indian businesses.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'ZSpace Tools' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZSpace Tools — Free Online Tools',
    description: 'Free online calculators and tools for business, GST, finance, and more.',
    images: ['/og-image.png'],
    creator: '@zspace_in',
  },
  alternates: {
    canonical: 'https://tools.zspace.in',
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'ZSpace Tools',
              url: 'https://tools.zspace.in',
              description: 'Free online tools for business and finance in India.',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://tools.zspace.in/search?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body className="bg-gray-50 antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
