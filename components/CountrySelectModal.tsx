import React from 'react';
import { X, Check, Globe2, TrendingUp, MapPin } from 'lucide-react';
import { SUPPORTED_COUNTRIES, CURRENCIES, DEFAULT_COUNTRY } from '../constants';

interface CountrySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (country: string) => void;
  currentCountry: string;
}

export const CountrySelectModal: React.FC<CountrySelectModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentCountry
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-5 border-b border-indigo-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Globe2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-wide">
                Selecione o País de Prospecção
              </h2>
              <p className="text-xs text-indigo-200/80">
                Moeda, valores médios de ticket por nicho, cidades e idioma de voz serão ajustados automaticamente.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Country Grid */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SUPPORTED_COUNTRIES.map(country => {
              const config = CURRENCIES[country];
              const isSelected = currentCountry === country;
              const isDefault = country === DEFAULT_COUNTRY;

              return (
                <button
                  key={country}
                  type="button"
                  onClick={() => {
                    onSelect(country);
                    onClose();
                  }}
                  className={`relative text-left p-4 rounded-xl border-2 transition-all flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/30'
                      : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md text-slate-900'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-white text-indigo-700 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{config.flag}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-black">{config.label}</span>
                      {isDefault && (
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full w-fit mt-0.5 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          Recomendado
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`text-[11px] flex flex-col gap-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Moeda: {config.code} ({config.symbol})
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Cidade padrão: {config.defaultCity}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[11px] text-slate-600 leading-relaxed">
            💡 <strong className="text-indigo-800">Como funciona:</strong> ao escolher o país, o sistema atualiza a moeda
            (formatação de valores e pipeline), os <strong>valores médios reais de ticket por nicho de alto ticket</strong>,
            as cidades sugeridas e o idioma do reconhecimento de voz no <strong>AI Live Copilot</strong> (chamadas, áudio e vídeo).
            Você pode trocar de país a qualquer momento pelo seletor no topo da tela.
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <span>
            País atual: <strong className="text-slate-800">{currentCountry} ({CURRENCIES[currentCountry]?.code})</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-colors"
          >
            Continuar
          </button>
        </div>

      </div>
    </div>
  );
};

export default CountrySelectModal;
