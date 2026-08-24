import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Last-Mile Delivery Tracker',
  description: 'Professional delivery management platform for logistics companies. Track orders, manage agents, and optimize last-mile delivery operations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
