import React, { useState, useEffect } from 'react';
import { LogEntry } from '../types';
import { getLogs } from '../services/mockDataService';

interface Props {
  groupId: string;
}

export const LogView: React.FC<Props> = ({ groupId }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    getLogs(groupId).then(setLogs);
  }, [groupId]);

  const getColor = (type: LogEntry['type']) => {
    switch (type) {
        case 'DANGER': return 'bg-red-50 border-red-200 text-red-800';
        case 'SUCCESS': return 'bg-green-50 border-green-200 text-green-800';
        case 'WARNING': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
        default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  return (
    <div className="pb-20 space-y-3">
        {logs.length === 0 && <p className="text-center text-slate-400 py-10">No hay registros aún.</p>}
        {logs.map(log => (
            <div key={log.id} className={`p-3 rounded-lg border text-sm ${getColor(log.type)}`}>
                <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold">{new Date(log.timestamp).toLocaleDateString()}</span>
                    <span className="text-xs opacity-75">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <p>{log.message}</p>
            </div>
        ))}
    </div>
  );
};