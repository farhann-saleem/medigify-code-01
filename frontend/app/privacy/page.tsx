import type { Metadata } from 'next';
import PolicyPage from '@/components/layout/PolicyPage';

export const metadata: Metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      intro={[
        'Your privacy is important to us. This policy explains how Medigify collects, uses, and protects your information.',
      ]}
      sections={[
        {
          heading: '1. Information We Collect',
          paragraphs: [
            'We collect anonymous usage analytics through Vercel Analytics to understand how visitors interact with Medigify. This includes page views, referral sources, browser type, device type, operating system, and geographic region. This data is aggregated and does not personally identify you.',
            'When you create an account, we may collect your name, email address, and learning progress data to provide personalized services.',
          ],
        },
        {
          heading: '2. Analytics & Cookies',
          paragraphs: [
            'Medigify uses Vercel Analytics, a privacy-focused analytics service provided by Vercel Inc. Vercel Analytics does not use cookies and does not collect personal data. It collects anonymous, aggregated data about page views and web vitals performance metrics. No cross-site tracking or advertising profiles are created from this data.',
            'For more details, see Vercel\'s privacy policy at https://vercel.com/legal/privacy-policy.',
          ],
        },
        {
          heading: '3. How We Use Information',
          paragraphs: [
            'Analytics data is used to understand usage patterns, improve site performance, and enhance the learning experience. Account information is used to personalize your learning, track progress, and communicate service updates.',
          ],
        },
        {
          heading: '4. Data Security',
          paragraphs: [
            'We implement industry-standard security measures to protect your information. Analytics data is processed by Vercel on their secure infrastructure. However, no method of electronic transmission is 100% secure.',
          ],
        },
        {
          heading: '5. Third Parties',
          paragraphs: [
            'We use Vercel Inc. as our hosting and analytics provider. Vercel processes anonymous analytics data on our behalf. We do not sell, trade, or share your personal information with third parties except as required by law or as described in this policy.',
          ],
        },
        {
          heading: '6. Your Rights',
          paragraphs: [
            'Since Vercel Analytics does not collect personal data or use cookies, no opt-out is required for analytics. For account-related data, you may request access, correction, or deletion of your personal information by contacting us.',
          ],
        },
        {
          heading: '7. Changes',
          paragraphs: [
            'We may update this policy from time to time. Please check back periodically for changes.',
          ],
        },
      ]}
      lastUpdated="July 2026"
    />
  );
}
