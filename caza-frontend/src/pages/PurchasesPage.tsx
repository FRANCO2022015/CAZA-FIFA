import React, { useEffect, useState } from 'react';
import { Trophy, ChevronDown, ChevronUp, FileDown, Printer } from 'lucide-react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { purchasesApi } from '../api/purchases';
import { useAuth } from '../hooks/useAuth';
import type { Purchase } from '../types';
import toast from 'react-hot-toast';

// Importación dinámica de jsPDF para no penalizar el bundle inicial
const exportPDF = async (purchase: Purchase, userName: string) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // ── Encabezado ──────────────────────────────────────────────────────────────
  doc.setFillColor(13, 13, 42);
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(167, 139, 250);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('⚽ CAZA MERCADO', 15, 20);

  doc.setTextColor(200, 200, 200);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Comprobante de Adquisición de Jugadores', 15, 30);

  // ── Info de la compra ──────────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  let y = 55;

  const infoRows = [
    ['N° Comprobante:', `#${purchase.id.toString().padStart(6, '0')}`],
    ['Comprador:', userName],
    ['Fecha de compra:', new Date(purchase.fechaCompra).toLocaleDateString('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })],
    ['Total abonado:', `$${Number(purchase.precioTotal).toLocaleString('es-ES')}`],
  ];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(108, 99, 255);
  doc.text('Datos de la transacción', 15, y);
  y += 8;
  doc.setDrawColor(108, 99, 255);
  doc.setLineWidth(0.4);
  doc.line(15, y, 195, y);
  y += 6;

  doc.setFontSize(10);
  for (const [label, value] of infoRows) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(label, 15, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    doc.text(value, 70, y);
    y += 7;
  }

  // ── Tabla de jugadores ─────────────────────────────────────────────────────
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(108, 99, 255);
  doc.text('Jugadores adquiridos', 15, y);
  y += 8;
  doc.line(15, y, 195, y);
  y += 6;

  // Cabecera tabla
  doc.setFillColor(108, 99, 255);
  doc.rect(15, y - 4, 180, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text('#', 18, y);
  doc.text('Jugador', 30, y);
  doc.text('Posición', 110, y);
  doc.text('Precio', 165, y);
  y += 8;

  // Filas
  purchase.players.forEach((player, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(240, 240, 255);
      doc.rect(15, y - 4, 180, 8, 'F');
    }
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'normal');
    doc.text(`${i + 1}`, 18, y);
    doc.setFont('helvetica', 'bold');
    doc.text(player.nombre, 30, y);
    doc.setFont('helvetica', 'normal');
    doc.text(player.posicion ?? '—', 110, y);
    doc.setTextColor(67, 160, 71);
    doc.text(`$${Number(player.precio).toLocaleString('es-ES')}`, 165, y);
    doc.setTextColor(30, 30, 30);
    y += 8;
  });

  // ── Total ──────────────────────────────────────────────────────────────────
  y += 4;
  doc.setDrawColor(108, 99, 255);
  doc.line(15, y, 195, y);
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(108, 99, 255);
  doc.text('TOTAL:', 140, y);
  doc.setTextColor(67, 160, 71);
  doc.text(`$${Number(purchase.precioTotal).toLocaleString('es-ES')}`, 165, y);

  // ── Pie de página ──────────────────────────────────────────────────────────
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.setFont('helvetica', 'normal');
  doc.text('Este comprobante es una representación ficticia generada por Caza Mercado de Jugadores.', 15, 280);
  doc.text(`Generado el ${new Date().toLocaleString('es-ES')}`, 15, 285);

  doc.save(`comprobante-compra-${purchase.id}.pdf`);
};

// ─── Componente ───────────────────────────────────────────────────────────────

const PurchasesPage: React.FC = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [exportingId, setExportingId] = useState<number | null>(null);

  useEffect(() => {
    purchasesApi.getPurchases()
      .then(setPurchases)
      .finally(() => setIsLoading(false));
  }, []);

  const toggle = (id: number) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleExportPDF = async (purchase: Purchase) => {
    setExportingId(purchase.id);
    try {
      await exportPDF(purchase, user?.nombre ?? 'Usuario');
      toast.success('Comprobante descargado ✅');
    } catch {
      toast.error('Error al generar el PDF');
    } finally {
      setExportingId(null);
    }
  };

  if (isLoading) return <Layout><div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div></Layout>;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Mis Compras</h1>
          <p className="text-gray-400 mt-1">{purchases.length} compra{purchases.length !== 1 ? 's' : ''} realizadas</p>
        </div>
        {purchases.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <FileDown className="w-4 h-4" />
            Descarga tus comprobantes en PDF
          </div>
        )}
      </div>

      {purchases.length === 0 ? (
        <EmptyState
          icon={<Trophy className="w-8 h-8" />}
          title="No tienes compras aún"
          description="Añade jugadores al carrito y realiza tu primera compra"
        />
      ) : (
        <div className="space-y-4">
          {purchases.map(purchase => (
            <div key={purchase.id} className="glass-card overflow-hidden">
              {/* Cabecera colapsable */}
              <button onClick={() => toggle(purchase.id)} className="w-full p-5 flex items-center justify-between text-left">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                       style={{ background: 'rgba(108,99,255,0.15)' }}>
                    <Trophy className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-gray-500">#{purchase.id}</span>
                      <span className="text-sm font-semibold text-white">
                        {new Date(purchase.fechaCompra).toLocaleDateString('es-ES', {
                          day: '2-digit', month: 'long', year: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {purchase.players.length} jugador{purchase.players.length !== 1 ? 'es' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-black gradient-text">
                    ${Number(purchase.precioTotal).toLocaleString()}
                  </span>
                  {expanded.has(purchase.id)
                    ? <ChevronUp className="w-5 h-5 text-gray-400" />
                    : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
              </button>

              {/* Detalle expandido */}
              {expanded.has(purchase.id) && (
                <div className="px-5 pb-5 border-t animate-fadeIn" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-xs text-gray-500 mb-3 mt-4">Jugadores comprados:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    {purchase.players.map(player => (
                      <div key={player.id} className="flex items-center gap-3 p-3 rounded-xl"
                           style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold overflow-hidden"
                             style={{ background: 'linear-gradient(135deg, #6C63FF, #FF6584)', color: 'white' }}>
                          {player.imagenUrl
                            ? <img src={player.imagenUrl} className="w-full h-full object-cover" alt={player.nombre} />
                            : player.nombre.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{player.nombre}</div>
                          <div className="text-xs text-gray-400">{player.posicion} · ${Number(player.precio).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Botón exportar PDF */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleExportPDF(purchase)}
                      disabled={exportingId === purchase.id}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #6C63FF, #FF6584)' }}
                    >
                      {exportingId === purchase.id
                        ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <FileDown className="w-4 h-4" />}
                      Exportar comprobante PDF
                    </button>

                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-300 hover:text-white transition-all"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <Printer className="w-4 h-4" />
                      Imprimir
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default PurchasesPage;
