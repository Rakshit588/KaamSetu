import type { Metadata, Viewport } from 'next';
import { Fraunces, Noto_Sans_Devanagari, Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const ui = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-ui', display: 'swap' });
const display = Fraunces({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const deva = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-deva',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'KaamSetu | Connecting Workers. Creating Opportunities.',
  description:
    'KaamSetu connects daily wage workers directly with customers: nearby, verified, transparently priced, no middlemen.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFF8E7' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0F1F' },
  ],
};

// Runs before first paint so there is no light-to-dark flash.
const themeScript = `try{var t=localStorage.getItem('ks-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${ui.variable} ${display.variable} ${deva.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
