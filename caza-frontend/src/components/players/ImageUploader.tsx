import React, { useRef, useState } from 'react';
import { Upload, X, ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { uploadPlayerImage } from '../../api/upload';

interface ImageUploaderProps {
  /** URL actual de la imagen (si ya existe una) */
  currentUrl?: string;
  /** Se llama con la URL pública una vez subida la imagen */
  onUploaded: (url: string) => void;
  /** Se llama cuando el usuario elimina/limpia la imagen */
  onClear?: () => void;
  /** Color de acento del borde/botón (hex) */
  accentColor?: string;
}

const MAX_MB = 10;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentUrl,
  onUploaded,
  onClear,
  accentColor = '#6C63FF',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Drag & drop state
  const [dragging, setDragging] = useState(false);

  const processFile = async (file: File) => {
    setError(null);
    setSuccess(false);

    if (!ALLOWED.includes(file.type)) {
      setError('Solo se permiten archivos JPG, PNG o WebP.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`El archivo supera el límite de ${MAX_MB} MB.`);
      return;
    }

    // Vista previa local inmediata
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setLoading(true);
    try {
      const url = await uploadPlayerImage(file);
      onUploaded(url);
      setSuccess(true);
    } catch {
      setError('Error al subir la imagen. Intenta de nuevo.');
      setPreview(currentUrl ?? null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so el mismo archivo puede volver a seleccionarse
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleClear = () => {
    setPreview(null);
    setSuccess(false);
    setError(null);
    onClear?.();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Etiqueta + especificaciones */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Foto del jugador
        </span>
        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', textAlign: 'right' }}>
          JPG · PNG · WebP · máx. {MAX_MB} MB<br />
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>Recomendado: 400 × 400 px</span>
        </span>
      </div>

      {/* Área de drop / preview */}
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          position: 'relative',
          width: '100%',
          height: '140px',
          borderRadius: '12px',
          border: `2px dashed ${dragging ? accentColor : 'rgba(255,255,255,0.12)'}`,
          background: dragging
            ? `${accentColor}12`
            : preview
              ? 'transparent'
              : 'rgba(255,255,255,0.03)',
          cursor: loading ? 'not-allowed' : 'pointer',
          overflow: 'hidden',
          transition: 'border-color 0.2s, background 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {preview ? (
          /* Imagen previa */
          <>
            <img
              src={preview}
              alt="Vista previa"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {/* Overlay al hacer hover */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '6px',
              opacity: loading ? 1 : 0,
              transition: 'opacity 0.2s',
            }}
              className="img-overlay"
            >
              {loading
                ? <Loader2 style={{ width: 28, height: 28, color: '#fff', animation: 'spin 0.7s linear infinite' }} />
                : <Upload style={{ width: 24, height: 24, color: '#fff' }} />
              }
              <span style={{ fontSize: '0.72rem', color: '#fff' }}>
                {loading ? 'Subiendo...' : 'Click para cambiar'}
              </span>
            </div>
            {/* Hover overlay (visible solo al hover, no al loading) */}
            {!loading && (
              <style>{`.img-overlay { opacity: 0 !important; } div:hover > .img-overlay { opacity: 1 !important; }`}</style>
            )}
          </>
        ) : (
          /* Estado vacío */
          <div style={{ textAlign: 'center', padding: '0 16px' }}>
            {loading ? (
              <Loader2 style={{ width: 32, height: 32, color: accentColor, margin: '0 auto 8px', animation: 'spin 0.7s linear infinite' }} />
            ) : (
              <ImageIcon style={{ width: 32, height: 32, color: 'rgba(255,255,255,0.2)', margin: '0 auto 8px' }} />
            )}
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              {loading ? 'Subiendo imagen...' : 'Arrastra aquí o haz clic para seleccionar'}
            </p>
          </div>
        )}
      </div>

      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Botones de acción */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '10px',
            border: `1px solid ${accentColor}50`,
            background: `${accentColor}15`,
            color: accentColor,
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'background 0.2s',
          }}
        >
          {loading
            ? <><Loader2 style={{ width: 14, height: 14, animation: 'spin 0.7s linear infinite' }} /> Subiendo...</>
            : success
              ? <><CheckCircle2 style={{ width: 14, height: 14 }} /> Imagen subida</>
              : <><Upload style={{ width: 14, height: 14 }} /> {preview ? 'Cambiar imagen' : 'Seleccionar imagen'}</>
          }
        </button>
        {preview && !loading && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid rgba(255,100,100,0.3)',
              background: 'rgba(255,100,100,0.08)',
              color: '#f87171',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <X style={{ width: 14, height: 14 }} /> Quitar
          </button>
        )}
      </div>

      {/* Mensajes */}
      {error && (
        <p style={{ fontSize: '0.72rem', color: '#f87171', margin: 0 }}>⚠ {error}</p>
      )}
      {success && !error && (
        <p style={{ fontSize: '0.72rem', color: '#4ade80', margin: 0 }}>✓ Imagen subida correctamente</p>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ImageUploader;
