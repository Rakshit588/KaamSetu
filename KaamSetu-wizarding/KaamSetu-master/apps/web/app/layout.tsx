import type { Metadata, Viewport } from 'next';
import {
  Cinzel,
  Cormorant_Garamond,
  JetBrains_Mono,
  Noto_Sans_Devanagari,
  Plus_Jakarta_Sans,
} from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';
import { Ambient } from '../components/magic/Ambient';
import { Providers } from './providers';

const ui = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-ui', display: 'swap' });
const display = Cinzel({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
});
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });
const deva = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-deva',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'KaamSetu | The Wizarding Marketplace. Connecting Workers. Creating Opportunities.',
  description:
    'KaamSetu connects daily wage workers directly with customers: nearby, verified, transparently priced, no middlemen.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#E9DCC0' },
    { media: '(prefers-color-scheme: dark)', color: '#090B10' },
  ],
};

// Dark ("Midnight") is the default. Runs before first paint so there is no flash; only an explicit light choice removes it.
const themeScript = `try{if(localStorage.getItem('ks-theme')==='light')document.documentElement.classList.remove('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`dark ${ui.variable} ${display.variable} ${serif.variable} ${mono.variable} ${deva.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Ambient />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
