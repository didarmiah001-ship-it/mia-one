import { urlEndpoint } from './imagekit';

interface UploadResponse {
  url: string;
  fileId: string;
  name: string;
}

export async function uploadToImageKit(file: File | Blob, fileName?: string): Promise<UploadResponse> {
  const authRes = await fetch(`${urlEndpoint}/auth`);
  const { token, expire, signature } = await authRes.json();

  const formData = new FormData();
  const name = fileName || `mia-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  formData.append('file', file);
  formData.append('fileName', name);
  formData.append('publicKey', 'public_i67rlxsde');
  formData.append('signature', signature);
  formData.append('expire', String(expire));
  formData.append('token', token);

  const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error(`ImageKit upload failed: ${res.statusText}`);
  const data = await res.json();
  return { url: data.url, fileId: data.fileId, name: data.name };
}

export async function uploadDataURLToImageKit(dataUrl: string, fileName?: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const { url } = await uploadToImageKit(blob, fileName);
  return url;
}
