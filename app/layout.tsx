import type { Metadata, Viewport } from "next";
import { Mulish } from "next/font/google";
import "./globals.css";
import AppLayoutWrapper from "@/app/layoutWrapper";

const mulishFont = Mulish({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MKR Sports Admin Portal",
  description: "This is the MKR Sports admin portal",
  icons: "/images/icon.png",
  robots: "noindex, nofollow",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-us">
      <body className={mulishFont.className}>
        <AppLayoutWrapper>{children}</AppLayoutWrapper>
      </body>
    </html>
  );
}
