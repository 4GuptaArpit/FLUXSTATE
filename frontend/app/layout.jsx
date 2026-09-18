import "./globals.css";

export const metadata = {
  title: "FluxState | Sub-Second Parallel Micro-Speculation on Monad",
  description: "Ultra-high-frequency parallelized micro-prediction markets powered by Monad's 1-second finality and parallel EVM.",
  openGraph: {
    title: "FluxState | Sub-Second Parallel Micro-Speculation on Monad",
    description: "Ultra-high-frequency parallelized micro-prediction markets powered by Monad's 1-second finality.",
    url: "https://fluxstate.monad.xyz",
    siteName: "FluxState",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FluxState | Sub-Second Parallel Micro-Speculation on Monad",
    description: "Micro-prediction markets with 1-second onchain settlements enabled exclusively by Monad's Parallel EVM.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
