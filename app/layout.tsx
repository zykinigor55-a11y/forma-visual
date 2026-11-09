import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Forma Визуал — ваш дом в новом образе",
  description: "Простая студия архитектурной визуализации. Выберите материалы, окружение и свет.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
