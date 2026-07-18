import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import { ThemeProvider } from '@/hooks/useTheme';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Medigify | Pakistan\'s Smartest Medical Question Bank',
    template: '%s | Medigify',
  },
  description:
    'Ace your medical exams with 10,000+ UHS past paper MCQs, spaced-repetition flashcards, and exam-realistic mock tests. Built for Pakistani medical students.',
  keywords: [
    'medical MCQs',
    'UHS past papers',
    'Pakistani medical students',
    'Medigify',
    'medical exam preparation',
    'flashcards',
    'mock tests',
    'MBBS MCQs',
  ],
  authors: [{ name: 'Medigify' }],
  creator: 'Medigify',
  metadataBase: new URL('https://medigify.com'),
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    url: 'https://medigify.com',
    siteName: 'Medigify',
    title: 'Medigify | Pakistan\'s Smartest Medical Question Bank',
    description:
      'Ace your medical exams with 10,000+ UHS past paper MCQs, spaced-repetition flashcards, and exam-realistic mock tests.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Medigify | Ace Your Medical Exams',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Medigify | Pakistan\'s Smartest Medical Question Bank',
    description:
      'Ace your medical exams with 10,000+ UHS past paper MCQs, spaced-repetition flashcards, and exam-realistic mock tests.',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col">
        <ThemeProvider>
          <a href="#main-content" className="skip-to-content">
            Skip to content
          </a>
          <Header />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'EducationalOrganization',
              name: 'Medigify',
              url: 'https://medigify.com',
              logo: 'https://medigify.com/icons/icon-512.png',
              description:
                "Pakistan's Smartest Medical Question Bank. Ace your medical exams with UAS past papers, spaced-repetition flashcards, and exam-realistic mock tests.",
              sameAs: [],
            }),
          }}
        />
      </body>
    </html>
  );
}
