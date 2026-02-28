import type { Metadata, Viewport } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import AppBanner from "@/components/AppBanner";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import RegisterSW from "@/components/RegisterSW";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const viewport: Viewport = {
  themeColor: "#c62828",
};

export const metadata: Metadata = {
  title: "Rugby Juniori Dinamo București",
  description: "Secția de juniori rugby a clubului CS Dinamo București. Grupe de vârstă U10, U12, U14, U16, U18.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Rugby Juniori Dinamo București",
    description: "Secția de juniori rugby a clubului CS Dinamo București",
    type: "website",
    url: "https://dinamorugby.ro",
    siteName: "Dinamo Rugby Juniori",
    locale: "ro_RO",
  },
  twitter: {
    card: "summary",
    title: "Rugby Juniori Dinamo București",
    description: "Secția de juniori rugby a clubului CS Dinamo București",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body className={`${montserrat.variable} ${inter.variable} font-body antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SportsTeam",
              name: "CS Dinamo București Rugby Juniori",
              url: "https://dinamorugby.ro",
              sport: "Rugby",
              memberOf: {
                "@type": "SportsOrganization",
                name: "Federația Română de Rugby",
              },
              address: {
                "@type": "PostalAddress",
                addressLocality: "București",
                addressCountry: "RO",
              },
            }),
          }}
        />
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <CookieConsent />
        <AppBanner />
        <GoogleAnalytics />
        <RegisterSW />
      </body>
    </html>
  );
}
