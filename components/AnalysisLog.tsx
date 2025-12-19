import React from 'react';
import { DetectedPerson } from '../types';

interface AnalysisLogProps {
  currentPeople: DetectedPerson[];
  history: { timestamp: string; count: number }[];
}

const AnalysisLog: React.FC<AnalysisLogProps> = ({ currentPeople, history }) => {
  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
          </svg>
          Live Analysis
        </h2>
        <div className="text-xs text-slate-500 mt-1 font-mono">
            {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Current Detections List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentPeople.length === 0 ? (
          <div className="text-center text-slate-600 py-10">
             <p className="text-sm">No detection data active.</p>
             <p className="text-xs mt-2">Click "Analyze Frame" to scan.</p>
          </div>
        ) : (
          currentPeople.map((person) => (
            <div key={person.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700 shadow-sm animate-fade-in-up">
              <div className="flex justify-between items-start mb-2">
                 <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 text-slate-300 text-xs font-bold font-mono">
                    {person.id}
                 </span>
                 <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    person.category.toLowerCase() === 'staff' ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'
                 }`}>
                    {person.category}
                 </span>
              </div>
              <p className="text-slate-300 text-sm leading-snug">{person.description}</p>
              <div className="mt-2 text-xs text-slate-500 font-mono">
                Box: [{person.boundingBox.join(', ')}]
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats / Footer */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Session Activity</h3>
        <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <div className="text-2xl font-bold text-white">{history.length}</div>
                <div className="text-xs text-slate-500">Scans</div>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <div className="text-2xl font-bold text-blue-400">
                    {history.reduce((acc, curr) => acc + curr.count, 0)}
                </div>
                <div className="text-xs text-slate-500">Total Faces</div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisLog;