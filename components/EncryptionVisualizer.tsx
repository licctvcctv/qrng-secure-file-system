import React from 'react';
import { EncryptionStep } from '../types';
import { CheckCircle, Circle, Loader2, XCircle, Terminal } from 'lucide-react';

interface EncryptionVisualizerProps {
  steps: EncryptionStep[];
}

const EncryptionVisualizer: React.FC<EncryptionVisualizerProps> = ({ steps }) => {
  return (
    <div className="space-y-0">
      {steps.map((step, index) => (
        <div key={step.id} className="relative pb-6 last:pb-0">
          
          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div className={`absolute left-[15px] top-8 bottom-0 w-0.5 z-0 transition-colors duration-500 ${
              steps[index+1].status !== 'pending' ? 'bg-emerald-500/30' : 'bg-slate-200'
            }`} />
          )}

          <div className="flex items-start relative z-10">
            {/* Status Icon */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 transition-all duration-300 bg-white ${
              step.status === 'completed' ? 'border-emerald-500 text-emerald-500' :
              step.status === 'processing' ? 'border-blue-500 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' :
              step.status === 'error' ? 'border-red-500 text-red-500' :
              'border-slate-200 text-slate-300'
            }`}>
              {step.status === 'completed' && <CheckCircle className="w-4 h-4" />}
              {step.status === 'processing' && <Loader2 className="w-4 h-4 animate-spin" />}
              {step.status === 'error' && <XCircle className="w-4 h-4" />}
              {step.status === 'pending' && <Circle className="w-4 h-4" />}
            </div>

            {/* Content Card */}
            <div className={`ml-4 flex-1 rounded-lg border p-3 transition-all duration-300 ${
               step.status === 'processing' ? 'bg-blue-50/50 border-blue-200 shadow-sm' : 
               step.status === 'completed' ? 'bg-slate-50 border-emerald-100' :
               'bg-transparent border-transparent'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${
                    step.status === 'processing' ? 'text-blue-700' : 
                    step.status === 'completed' ? 'text-slate-800' : 'text-slate-400'
                  }`}>
                    {step.title}
                  </h3>
                  <p className={`text-xs mt-0.5 ${step.status === 'pending' ? 'text-slate-300' : 'text-slate-500'}`}>
                    {step.description}
                  </p>
                </div>
                {step.status === 'processing' && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono animate-pulse">
                    RUNNING
                  </span>
                )}
              </div>

              {/* Technical Metadata Drawer - THIS PROVIDES THE "PURPOSE" */}
              {step.technicalDetail && (step.status === 'completed' || step.status === 'processing') && (
                <div className="mt-3 pt-2 border-t border-slate-200/50 animate-in slide-in-from-top-1">
                   <div className="flex items-start space-x-2">
                      <Terminal className="w-3 h-3 text-slate-400 mt-0.5" />
                      <code className="text-[10px] font-mono text-slate-600 break-all leading-relaxed bg-slate-100/50 px-1.5 py-1 rounded w-full">
                        {step.technicalDetail}
                      </code>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EncryptionVisualizer;