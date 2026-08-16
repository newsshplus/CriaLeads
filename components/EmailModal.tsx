import React, { useState, useRef } from 'react';
import { X, Send, Sparkles, Image as ImageIcon, RotateCcw, Save, Users } from 'lucide-react';
import { Lead } from '../types';
import { COMPANY_EMAIL_TEMPLATE } from '../constants';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeads: Lead[];
  onSend: (template: string) => void;
  isSending: boolean;
  progress: { current: number; total: number };
}

const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose, selectedLeads, onSend, isSending, progress }) => {
  // Initialize with the Company Template defined in constants.ts
  const [template, setTemplate] = useState(COMPANY_EMAIL_TEMPLATE);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setTemplate(newVal);
  };

  const handleResetTemplate = () => {
    if (window.confirm("Deseja restaurar o modelo padrão da empresa?")) {
      setTemplate(COMPANY_EMAIL_TEMPLATE);
    }
  };

  const handleInsertImage = () => {
    const url = window.prompt("Cole a URL da imagem que deseja inserir (ex: https://site.com/logo.png):");
    if (url && textareaRef.current) {
      const imgTag = `\n<img src="${url}" alt="Imagem" style="max-width: 100%; height: auto; margin: 10px 0;" />\n`;
      
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      
      const newText = template.substring(0, start) + imgTag + template.substring(end);
      
      setTemplate(newText);
      
      // Restore focus
      setTimeout(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(start + imgTag.length, start + imgTag.length);
        }
      }, 0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col m-4 border border-gray-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-xl">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Campanha de Email IA
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Personalização automática para {selectedLeads.length} leads selecionados
            </p>
          </div>
          {!isSending && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto bg-gray-50">
          
          {isSending ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-6">
               <div className="relative">
                 <div className="w-20 h-20 border-4 border-indigo-100 rounded-full"></div>
                 <div className="w-20 h-20 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin absolute top-0"></div>
                 <div className="absolute inset-0 flex items-center justify-center font-bold text-indigo-700">
                    {Math.round((progress.current / progress.total) * 100)}%
                 </div>
               </div>
               
               <div className="text-center">
                 <h4 className="text-lg font-medium text-gray-900">Enviando e-mails personalizados...</h4>
                 <p className="text-gray-500 mt-1">
                   Processando {progress.current} de {progress.total} empresas
                 </p>
               </div>

               <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-md">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  ></div>
               </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex justify-between items-center">
                  <span>Editor de Template</span>
                  <span className="flex items-center text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded">
                     <Users className="w-3 h-3 mr-1" />
                     Padrão da Empresa (constants.ts)
                  </span>
                </label>
                
                {/* Editor Toolbar */}
                <div className="flex items-center gap-2 mb-2">
                    <button 
                        onClick={handleInsertImage}
                        className="flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                        title="Inserir Imagem via URL"
                    >
                        <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
                        Inserir Imagem
                    </button>
                    <button 
                        onClick={handleResetTemplate}
                        className="flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors ml-auto"
                        title="Restaurar padrão da empresa"
                    >
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                        Resetar Padrão
                    </button>
                </div>

                <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={template}
                      onChange={handleTemplateChange}
                      className="w-full h-80 p-5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm leading-relaxed bg-white text-gray-900 shadow-sm resize-none"
                      placeholder="Escreva seu template aqui..."
                    />
                    <div className="absolute bottom-4 right-4 text-xs text-gray-400 bg-white/80 px-2 rounded">
                        Variáveis: {'{{name}}'}, {'{{city}}'}
                    </div>
                </div>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <h5 className="text-xs font-bold text-indigo-800 uppercase tracking-wide mb-2">Destinatários Selecionados</h5>
                <div className="flex flex-wrap gap-2">
                  {selectedLeads.slice(0, 5).map(lead => (
                    <span key={lead.id} className="inline-flex items-center px-2 py-1 rounded bg-white text-xs text-indigo-700 border border-indigo-200">
                      {lead.name}
                    </span>
                  ))}
                  {selectedLeads.length > 5 && (
                    <span className="inline-flex items-center px-2 py-1 rounded bg-white text-xs text-gray-500 border border-gray-200">
                      +{selectedLeads.length - 5} outros
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isSending && (
          <div className="px-6 py-4 bg-white border-t border-gray-100 flex justify-end space-x-3 rounded-b-xl">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => onSend(template)}
              disabled={selectedLeads.length === 0}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4 mr-2" />
              Confirmar e Enviar ({selectedLeads.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailModal;