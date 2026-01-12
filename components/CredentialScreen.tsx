
import React, { useMemo } from 'react';
import { ArrowLeftIcon, ShieldCheckIcon, IdentificationIcon } from './icons';

interface CredentialScreenProps {
  onBack: () => void;
  onShowVerification: () => void;
}

const CredentialScreen: React.FC<CredentialScreenProps> = ({ onBack, onShowVerification }) => {
  const issueDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2); // Sample: issued 2 months ago
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }, []);

  // Simulated unique ID for the verification URL
  const verificationId = "IBD-NX-992-8172";

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white overflow-y-auto">
      <header className="p-4 flex items-center justify-between flex-shrink-0 z-10">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-800 transition-colors">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold uppercase tracking-wider text-slate-400">Digital Credential</h1>
        <div className="w-10"></div> {/* Spacer */}
      </header>

      <main className="flex-grow p-4 sm:p-8 flex flex-col items-center">
        {/* Authoritative Card */}
        <div className="w-full max-w-md bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden relative">
          {/* Subtle animated shimmer background */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" 
               style={{ animation: 'shimmer 4s infinite' }}></div>
          
          <div className="p-6 relative">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-2">
                <IdentificationIcon className="w-8 h-8 text-cyan-500" />
                <span className="font-bold text-lg tracking-tighter">IBD NEXUS</span>
              </div>
              <div className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded-full border border-green-500/30 flex items-center gap-1">
                <ShieldCheckIcon className="w-3 h-3" />
                ACTIVE
              </div>
            </div>

            <div className="space-y-6 mb-8">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Holder</p>
                <p className="text-2xl font-semibold tracking-tight">ALEX M.</p>
              </div>

              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Title</p>
                <p className="text-xl font-medium text-slate-200">Hidden Disability Verification</p>
              </div>

              <div className="flex justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Issued</p>
                  <p className="text-sm font-medium text-slate-300">{issueDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">ID</p>
                  <p className="text-sm font-mono text-slate-300">{verificationId}</p>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="flex flex-col items-center bg-white p-4 rounded-xl shadow-inner cursor-pointer" onClick={onShowVerification}>
              {/* Using a placeholder SVG for a professional-looking QR code */}
              <svg className="w-40 h-40 text-slate-900" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="100" fill="white"/>
                <path d="M10 10h20v20h-20zM15 15h10v10h-10zM70 10h20v20h-20zM75 15h10v10h-10zM10 70h20v20h-20zM15 75h10v10h-10z" fill="currentColor"/>
                <rect x="35" y="10" width="5" height="5" fill="currentColor"/>
                <rect x="45" y="15" width="10" height="5" fill="currentColor"/>
                <rect x="60" y="10" width="5" height="15" fill="currentColor"/>
                <rect x="35" y="25" width="15" height="5" fill="currentColor"/>
                <rect x="10" y="35" width="5" height="10" fill="currentColor"/>
                <rect x="20" y="45" width="10" height="5" fill="currentColor"/>
                <rect x="35" y="35" width="20" height="20" fill="currentColor"/>
                <rect x="60" y="35" width="15" height="5" fill="currentColor"/>
                <rect x="80" y="40" width="10" height="10" fill="currentColor"/>
                <rect x="35" y="60" width="5" height="10" fill="currentColor"/>
                <rect x="45" y="70" width="10" height="20" fill="currentColor"/>
                <rect x="60" y="60" width="15" height="15" fill="currentColor"/>
                <rect x="80" y="70" width="10" height="5" fill="currentColor"/>
                <rect x="10" y="55" width="15" height="5" fill="currentColor"/>
              </svg>
              <p className="mt-2 text-[10px] text-slate-500 font-bold tracking-tighter uppercase">Tap QR to verify status</p>
            </div>
          </div>
          
          <div className="bg-slate-700/30 p-4 text-center border-t border-slate-700">
             <p className="text-[10px] text-slate-400 font-medium">Verified by IBD Nexus Health Authority</p>
          </div>
        </div>

        <div className="mt-8 max-w-sm text-center">
          <p className="text-slate-500 text-xs">
            Present this screen for priority access or when disclosing a hidden disability to authorized personnel. 
            No sensitive medical data is revealed.
          </p>
        </div>
      </main>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default CredentialScreen;
