import "./globals.css";

export const metadata = {
  title: "Finance Manager",
  description: "Simple finance manager built with Next.js, FastAPI, and Firebase.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
