import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Residency Updates - Homepage',
  description: 'Comprehensive summaries of our builders and their journey',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}