import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Proof Walkthrough | Executive Intent',
  description: 'Redirects to /proof',
};

export default function DemoPage() {
  redirect('/proof');
}
