import React, { useState, useEffect } from 'react';
import { Evidence, Group, Participant, EvidenceStatus } from '../types';
import { getEvidence, updateGroupFine, reviewEvidence, updateParticipant, addLog } from '../services/mockDataService';
import { Check, X, ExternalLink } from 'lucide-react';

interface Props {
  group: Group;
  participants: Participant[];
  currentUser: any;
  onRefresh: () => void;
}

export const EncargadoView: React.FC<Props> = ({ group, participants, currentUser, onRefresh }) => {
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [newFineAmount, setNewFineAmount] = useState(group.currentFineAmount);

  useEffect(() => {
    loadEvidence();
  }, [group.id]);

  const loadEvidence = async () => {
    const data = await getEvidence(group.id);
    setEvidenceList(data.filter(e => e.status === EvidenceStatus.PENDING));
  };

  const handleUpdateFine = async () => {
    await updateGroupFine(group.id, newFineAmount);
    onRefresh();
  };

  const handleReview = async (evidenceId: string, status: EvidenceStatus) => {
    await reviewEvidence(evidenceId, status, currentUser.username);
    loadEvidence();
    onRefresh();
  };

  const handleObjectiveChange = async (userId: string, newObjective: string) => {
    await updateParticipant(group.id, userId, { currentObjective: newObjective });
    await addLog(group.id, `Objetivo actualizado para un participante`, 'INFO');
    onRefresh();
  };

  return (
    <div className="pb-20 space-y-8">
        {/* Section 1: Review Evidence */}
        <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Validar Evidencia Pendiente</h3>
            {evidenceList.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No hay evidencias pendientes.</p>
            ) : (
                <div className="space-y-4">
                    {evidenceList.map(e => (
                        <div key={e.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                             <div className="flex justify-between mb-2">
                                <span className="font-bold text-sm text-slate-700">{e.username}</span>
                                <span className="text-xs text-slate-400">{new Date(e.timestamp).toLocaleDateString()}</span>
                             </div>
                             <p className="text-sm text-slate-600 mb-2">{e.description}</p>
                             {e.imageUrl && (
                                <div className="mb-2">
                                    <a href={e.imageUrl} target="_blank" rel="noreferrer" className="text-teal-600 text-xs flex items-center gap-1 hover:underline">
                                        <ExternalLink size={12}/> Ver Foto
                                    </a>
                                </div>
                             )}
                             <div className="flex gap-2 mt-2">
                                <button onClick={() => handleReview(e.id, EvidenceStatus.REJECTED)} className="flex-1 bg-white border border-red-200 text-red-600 py-1 rounded shadow-sm hover:bg-red-50">
                                    <X size={16} className="mx-auto" />
                                </button>
                                <button onClick={() => handleReview(e.id, EvidenceStatus.APPROVED)} className="flex-1 bg-teal-600 text-white py-1 rounded shadow-sm hover:bg-teal-700">
                                    <Check size={16} className="mx-auto" />
                                </button>
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </section>

        {/* Section 2: Config Fine */}
        <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Ajustar Multa Base</h3>
            <div className="flex gap-2">
                <input 
                    type="number" 
                    className="flex-1 border p-2 rounded" 
                    value={newFineAmount}
                    onChange={e => setNewFineAmount(Number(e.target.value))}
                />
                <button 
                    onClick={handleUpdateFine}
                    className="bg-slate-800 text-white px-4 rounded font-medium text-sm"
                >
                    Actualizar
                </button>
            </div>
        </section>

        {/* Section 3: Objectives */}
        <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Objetivos Semanales</h3>
            <div className="space-y-3">
                {participants.map(p => (
                    <div key={p.userId} className="text-sm">
                        <p className="font-semibold text-slate-700 mb-1">{p.username}</p>
                        <div className="flex gap-2">
                            <input 
                                className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-600"
                                defaultValue={p.currentObjective}
                                onBlur={(e) => {
                                    if(e.target.value !== p.currentObjective) {
                                        handleObjectiveChange(p.userId, e.target.value);
                                    }
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    </div>
  );
};