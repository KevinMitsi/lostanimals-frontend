/** SHA-256 del archivo en base64, vía Web Crypto (asíncrono, no bloquea el hilo principal). */
export async function sha256Base64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const bytes = new Uint8Array(hashBuffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
