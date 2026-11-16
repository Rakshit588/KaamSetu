export const metadata = {
  title: 'KaamSetu',
  description: 'Connecting Workers. Creating Opportunities.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
