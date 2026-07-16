import { urlEndpoint } from './imagekit';

const SUPABASE_URL = 'https://ljtwvmgxrhwrwaaovlbi.supabase.co';
const AUTH_ENDPOINT = `${SUPABASE_URL}/functions/v1/imagekit-auth`;
const PUBLIC_KEY = 'public_yEPy2DHHPu/KY2jJ3R5GIjfbkZc=';
const UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';

interface UploadResponse {
  url: string;
  fileId: string;
  name: string;
}

interface AuthParams {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
}

async function fetchAuthParams(): Promise<AuthParams> {
  console.log('[ImageKit] Fetching auth params from', AUTH_ENDPOINT);
  const res = await fetch(AUTH_ENDPOINT);

  if (!res.ok) {
    const body = await res.text().catch(() => '<unreadable>');
    console.error(`[ImageKit] Auth endpoint returned ${res.status} ${res.statusText}`, body);
    throw new Error(`ImageKit auth failed: ${res.status} ${res.statusText} — ${body}`);
  }

  const data = await res.json();
  console.log('[ImageKit] Auth response:', {
    token: data.token,
    expire: data.expire,
    signature: data.signature ? '(present)' : '(missing)',
    publicKey: data.publicKey,
  });

  if (!data.token || !data.expire || !data.signature || !data.publicKey) {
    throw new Error('ImageKit auth endpoint returned incomplete data');
  }

  return { token: data.token, expire: data.expire, signature: data.signature, publicKey: data.publicKey };
}

export async function uploadToImageKit(file: File | Blob, fileName?: string): Promise<UploadResponse> {
  const { token, expire, signature, publicKey } = await fetchAuthParams();

  const name = fileName || `mia-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', name);
  formData.append('publicKey', publicKey);
  formData.append('signature', signature);
  formData.append('expire', String(expire));
  formData.append('token', token);

  const res = await fetch(UPLOAD_URL, { method: 'POST', body: formData });

  if (!res.ok) {
    const body = await res.text().catch(() => '<unreadable>');
    console.error(`[ImageKit] Upload failed: ${res.status} ${res.statusText}`, body);
    throw new Error(`ImageKit upload failed: ${res.status} ${res.statusText} — ${body}`);
  }

  const data = await res.json();
  return { url: data.url, fileId: data.fileId, name: data.name };
}

export async function uploadDataURLToImageKit(dataUrl: string, fileName?: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const { url } = await uploadToImageKit(blob, fileName);
  return url;
}
