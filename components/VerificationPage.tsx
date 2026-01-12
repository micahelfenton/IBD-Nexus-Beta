
import React from 'react';
import { ShieldCheckIcon, IdentificationIcon, XIcon } from './icons';

interface VerificationPageProps {
  onClose: () => void;
}

const VerificationPage: React.FC<VerificationPageProps> = ({ onClose }) => {
  const timestamp = new Date().toLocaleString();

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="bg-slate-900 p-6 flex justify-between items-center">
          <div className="flex items-center gap-2 text-white">
            <IdentificationIcon className="w-6 h-6 text-cyan-400" />
            <span className="font-bold tracking-tight">IBD NEXUS VERIFY</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <ShieldCheckIcon className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Verification Confirmed</h1>
          <div className="inline-block bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-8">
            ACTIVE STATUS
          </div>

          <div className="w-full space-y-4 mb-8 text-left">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-sm text-slate-500">Credential Type</span>
              <span className="text-sm font-semibold text-slate-900">Hidden Disability</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-sm text-slate-500">Verification ID</span>
              <span className="text-sm font-mono font-semibold text-slate-900">IBD-NX-992-8172</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-sm text-slate-500">Last Verified</span>
              <span className="text-sm font-semibold text-slate-900">{timestamp}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left">
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "This verification confirms the holder has a recognised hidden disability. 
              No medical or diagnostic information is disclosed. Please provide reasonable 
              assistance or access as requested."
            </p>
          </div>
        </div>

        <div className="bg-slate-100 p-4 text-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Secure Verification System</p>
        </div>
      </div>
      
      <p className="mt-8 text-slate-400 text-[10px] text-center max-w-xs">
        This is an official verification page from IBD Nexus. It is intended for visual inspection by authorized personnel.
      </p>
    </div>
  );
};

export default VerificationPage;
