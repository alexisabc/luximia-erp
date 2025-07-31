'use client';

import { Player } from '@lottiefiles/react-lottie-player';

export default function Loader({ className = '', size = 400, overlay = true }) {
  return (
    <div
      className={`${overlay ? 'fixed inset-0 bg-black/40 backdrop-blur-sm z-50' : ''} flex items-center justify-center ${className}`}
    >
      <Player
        autoplay
        loop
        src="https://lottie.host/c44dc691-1f3f-41b3-abdd-32738188bbbe/9LJJrHUN7m.json"
        style={{ height: size, width: size }}
      />
    </div>
  );
}

