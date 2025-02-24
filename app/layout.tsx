import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Image Upload App',
    description: 'Upload and analyze images',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" data-oid="2i4-b-n">
            <body className={inter.className} data-oid="y0tecfm">
                {children}
            </body>
        </html>
    );
}
