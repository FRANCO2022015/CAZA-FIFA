import api from './axiosConfig';

/**
 * Sube una imagen de jugador al backend.
 * @param file  Archivo JPG/PNG/WebP (máx. 5 MB)
 * @returns     URL pública donde quedó guardada la imagen
 */
export async function uploadPlayerImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<{ success: boolean; data: { url: string } }>(
    '/upload/image',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );

  return response.data.data.url;
}
