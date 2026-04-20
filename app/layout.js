import './globals.css'

export const metadata = {
  title: 'Inkwell — Your Private Journal',
  description: 'A beautiful, private space for your thoughts, moods and memories.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* 
          viewport meta tag — critical for mobile.
          width=device-width  → use actual screen width
          initial-scale=1     → don't zoom in on load
          viewport-fit=cover  → respect iPhone notch / safe areas
        */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        {/* Theme color for mobile browser chrome */}
        <meta name="theme-color" content="#07070f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Read saved theme before paint — prevents flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('inkwell-theme') || 'dark';
              document.documentElement.setAttribute('data-theme', t);
            } catch(e) {
              document.documentElement.setAttribute('data-theme', 'dark');
            }
          })();
        `}} />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}