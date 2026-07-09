// Converte fotos HEIC/HEIF para JPEG no navegador, antes do upload.
// iPhones podem entregar fotos em HEIC, que o Storage (bucket `fichas`) e o
// WhatsApp não aceitam/renderizam. A conversão roda no device via heic2any
// (import dinâmico, para não pesar o bundle inicial). Nunca bloqueia: se falhar,
// o chamador segue com o arquivo original.

function ehHeic(file: File): boolean {
  const nome = (file.name ?? '').toLowerCase();
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    nome.endsWith('.heic') ||
    nome.endsWith('.heif')
  );
}

export async function garantirJpeg(file: File): Promise<File> {
  if (!ehHeic(file)) return file;

  const { default: heic2any } = await import('heic2any');
  const convertido = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
  const blob = Array.isArray(convertido) ? convertido[0] : convertido;

  const baseNome = (file.name || 'foto').replace(/\.(heic|heif)$/i, '');
  return new File([blob], `${baseNome}.jpg`, { type: 'image/jpeg' });
}
