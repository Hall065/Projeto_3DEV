import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Karton - Gestão Inteligente de Estoque",
  description: "O Karton simplifica o gerenciamento de inventário com rastreamento em tempo real, análises inteligentes e integrações poderosas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
