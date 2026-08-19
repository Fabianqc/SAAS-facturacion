'use client';

import React, { useEffect, useState } from 'react';
import { History, X, Clock, Calendar, CheckCircle2, TrendingUp, Coins, RefreshCw } from 'lucide-react';

interface HistoryItem {
  id: string;
  source: string;
  rate: number;
  isActive: boolean;
  createdAt: string;
}

interface BcvHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BcvHistoryModal: React.FC<BcvHistoryModalProps> = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/bcv/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error('Error cargando historial de tasas BCV:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-card max-w-2xl w-full rounded-3xl border border-slate-800 p-6 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Historial de Cambios de Tasas BCV</h3>
              <p className="text-xs text-slate-400">Bitácora de variaciones detectadas y registradas en la base de datos</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Refresh & Info */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Solo se guardan nuevos registros en PostgreSQL cuando ocurre una variación real en la tasa del BCV.
          </span>

          <button
            onClick={fetchHistory}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-all flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </button>
        </div>

        {/* Table of History */}
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] sticky top-0 backdrop-blur-md">
              <tr>
                <th className="p-3.5 rounded-l-xl">Divisa / Origen</th>
                <th className="p-3.5">Tasa Oficial (VES)</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5 rounded-r-xl">Fecha y Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {history.map((item) => {
                const isUsd = item.source.includes('USD') || item.source.includes('Scraped');
                const isEur = item.source.includes('EUR');

                return (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3.5 font-medium text-white flex items-center gap-2">
                      {isUsd && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                      {isEur && <Coins className="w-4 h-4 text-cyan-400" />}
                      <span>{item.source}</span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-white text-sm">
                      {item.rate.toFixed(4)} VES
                    </td>
                    <td className="p-3.5">
                      {item.isActive ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[10px] border border-emerald-500/30">
                          ACTIVA HOY
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-500 font-mono text-[10px]">
                          HISTÓRICA
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                      {new Date(item.createdAt).toLocaleString('es-VE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
