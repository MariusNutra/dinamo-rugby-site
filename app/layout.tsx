import type { Metadata, Viewport } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import AppBanner from "@/components/AppBanner";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import RegisterSW from "@/components/RegisterSW";
import InvelisPublic from "@/components/InvelisPublic";

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
  metadataBase: new URL("https://dinamorugby.ro"),
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
              legalName: "Asociația Sportivă Dinamo Rugby Junior",
              taxID: "50227280",
              sameAs: [
                "https://www.facebook.com/profile.php?id=61592998121958",
                "https://www.instagram.com/dinamorugbyjuniori/",
                "https://www.tiktok.com/@dinamo.rugby",
              ],
              url: "https://dinamorugby.ro",
              sport: "Rugby",
              memberOf: {
                "@type": "SportsOrganization",
                name: "Federația Română de Rugby",
              },
              address: {
                "@type": "PostalAddress",
                // Stadionul, nu sediul social: pentru cautarea locala conteaza
                // unde se antreneaza copiii, nu unde raspunde asociatia in fata
                // legii. Sediul social ramane in paginile legale.
                streetAddress: "Șos. Ștefan cel Mare nr. 7-9",
                addressLocality: "București",
                addressRegion: "Sector 2",
                addressCountry: "RO",
              },
            }),
          }}
        />
        <InvelisPublic
          antet={<Header />}
          subsol={<Footer />}
          benzi={<><CookieConsent /><AppBanner /></>}
        >
          {children}
        </InvelisPublic>
        <GoogleAnalytics />
        <RegisterSW />
      </body>
    </html>
  );
}
