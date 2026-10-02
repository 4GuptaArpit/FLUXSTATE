import "./globals.css";

export const metadata = {
  title: "FluxState | Block-by-Block Funding Perpetuals on Monad",
  description: "Institutional-grade perpetuals DEX with block-by-block dynamic funding and 16-shard parallel EVM architecture on Monad.",
  openGraph: {
    title: "FluxState | Block-by-Block Funding Perpetuals on Monad",
    description: "Sub-second perpetuals with continuous block-by-block funding rates powered by Monad's 1-second finality and Block-STM.",
    url: "https://fluxstate-monad.vercel.app",
    siteName: "FluxState",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FluxState | Block-by-Block Funding Perpetuals on Monad",
    description: "Perpetuals with funding that updates every block enabled by Monad's 16-shard parallel EVM architecture.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
