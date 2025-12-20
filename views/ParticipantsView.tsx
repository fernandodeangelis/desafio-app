import React, { useState, useEffect } from 'react';
import { Participant, Evidence, EvidenceStatus } from '../types';
import { getEvidence, uploadEvidence } from '../services/mockDataService';
import { CheckCircle2, Clock, XCircle, Upload, Camera } from 'lucide-react';

interface Props {
  participants: Participant[];
  currentUser: any;
  groupId: string;
}

export const ParticipantsView: React.FC<Props> = ({ participants, currentUser, groupId }) => {
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [groupId]);

  const loadData = async () => {
    const data = await getEvidence(groupId);
    setEvidenceList(data);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    await uploadEvidence(groupId, currentUser.id, currentUser.username, description, selectedFile);
    await loadData();
    setUploading(false);
    setShowUploadModal(false);
    setDescription('');
    setSelectedFile(null);
  };

  const getStatusIcon = (status?: EvidenceStatus) => {
    switch (status) {
      case EvidenceStatus.APPROVED: return <CheckCircle2 className="text-green-500" size={20} />;
      case EvidenceStatus.REJECTED: return <XCircle className="text-red-500" size={20} />;
      case EvidenceStatus.PENDING: return <Clock className="text-yellow-500" size={20} />;
      default: return <span className="text-slate-300 text-xs">Sin evidencia</span>;
    }
  };

  return (
    <div className="pb-20">
      <div className="grid gap-4">
        {participants.map(p => {
            // Find latest evidence for current week
            const userEvidence = evidenceList.find(e => e.userId === p.userId && e.status !== EvidenceStatus.REJECTED); // Simplified logic
            const isMe = p.userId === currentUser.id;

            return (
                <div key={p.userId} className={`bg-white rounded-xl p-4 shadow-sm border ${isMe ? 'border-teal-200 bg-teal-50' : 'border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">{p.username} {isMe && '(Tú)'}</h3>
                            <p className="text-xs text-slate-500 mt-1">{p.currentObjective}</p>
                        </div>
                        <div className="flex flex-col items-end">
                             <div className="text-sm font-semibold text-red-500 bg-red-50 px-2 py-1 rounded">
                                Multa: ${p.accumulatedFine}
                             </div>
                             <div className="mt-2" title={userEvidence?.status || 'Nada'}>
                                {getStatusIcon(userEvidence?.status)}
                             </div>
                        </div>
                    </div>
                    
                    {isMe && (
                        <button 
                            onClick={() => setShowUploadModal(true)}
                            className="w-full mt-3 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                        >
                            <Upload size={16} /> Subir Evidencia
                        </button>
                    )}
                </div>
            )
        })}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
                <h3 className="text-lg font-bold mb-4 text-slate-800">Cargar Evidencia</h3>
                <form onSubmit={handleUpload}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
                        <textarea 
                            required
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                            rows={3}
                            placeholder="Ej: Corrí 5km en el parque..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Foto / Captura</label>
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                            {selectedFile ? (
                                <p className="text-sm text-teal-600 font-medium">{selectedFile.name}</p>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <Camera className="text-slate-400 mb-2" size={24} />
                                    <p className="text-xs text-slate-400">Toca para seleccionar</p>
                                </div>
                            )}
                            <input type="file" className="hidden" accept="image/*" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                        </label>
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 py-2 text-slate-600 font-medium">Cancelar</button>
                        <button type="submit" disabled={uploading} className="flex-1 bg-teal-600 text-white py-2 rounded-lg font-medium">
                            {uploading ? 'Subiendo...' : 'Enviar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};