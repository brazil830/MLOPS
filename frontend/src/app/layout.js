import './globals.css';
import Providers from '@/context/Providers';

export const metadata = {
  title: 'Talkie — 3D Immersive AI Companion World',
  description: 'Step into an immersive 3D world of emotionally intelligent AI companions. Real relationships, living character presence, and spatial conversations.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body>
        <div className="ambient-scene-glow" aria-hidden="true" />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
