import { ImageKitProvider } from '@imagekit/react';
import type { ReactNode } from 'react';

const urlEndpoint = 'https://ik.imagekit.io/i67rlxsde';

export function ImageKit({ children }: { children: ReactNode }) {
  return (
    <ImageKitProvider urlEndpoint={urlEndpoint}>
      {children}
    </ImageKitProvider>
  );
}

export { urlEndpoint };
