import type { Metadata } from 'next';
import PaymentSuccessContent from './PaymentSuccessContent';

export const metadata: Metadata = {
  title: 'Payment Successful',
};

export default function PaymentSuccessPage() {
  return <PaymentSuccessContent />;
}
