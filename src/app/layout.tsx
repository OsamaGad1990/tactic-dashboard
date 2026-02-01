import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tactic Portal',
  description: 'Admin Dashboard',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
