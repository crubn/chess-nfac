import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "BigTech Interview Chess",
  description: "3D chess with AI coaching, multiplayer rooms, and Vibe themes. Built for NFAC.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Prevent theme flash: set class before React hydrates */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem("nfac_theme")==="light")document.documentElement.classList.add("theme-light")}catch(e){}` }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
