import Reveal from '@/components/ui/Reveal';
import Hero from '@/components/landing/Hero';
import TrustBar from '@/components/landing/TrustBar';
import HowItWorks from '@/components/landing/HowItWorks';
import Features from '@/components/landing/Features';
import FAQ from '@/components/landing/FAQ';
import FinalCTA from '@/components/landing/FinalCTA';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Reveal>
        <TrustBar />
      </Reveal>
      <Reveal delay={50}>
        <HowItWorks />
      </Reveal>
      <Reveal delay={50}>
        <Features />
      </Reveal>
      <Reveal delay={50}>
        <FAQ />
      </Reveal>
      <Reveal delay={50}>
        <FinalCTA />
      </Reveal>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Medigify',
            description:
              "Pakistan's smartest medical question bank with 10,000+ UHS past paper MCQs.",
            url: 'https://medigify.com',
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'Any',
            browserRequirements: 'Requires a modern web browser',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'PKR',
            },
          }),
        }}
      />
    </>
  );
}
