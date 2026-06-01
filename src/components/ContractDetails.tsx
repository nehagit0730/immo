import { useState, FormEvent } from 'react';
import { Language } from '../translations';
import { PenTool, Printer, Check, Info } from 'lucide-react';

interface ContractDetailsProps {
  currentLanguage: Language;
}

export default function ContractDetails({ currentLanguage }: ContractDetailsProps) {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [isSigned, setIsSigned] = useState(false);
  const [signDate, setSignDate] = useState('');

  const handleSignContract = (e: FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail || !clientPhone) {
      alert(currentLanguage === 'en' ? 'Please fill in Name, Email and Phone first!' : 'Veuillez remplir le nom, l\'e-mail et le téléphone !');
      return;
    }
    setIsSigned(true);
    setSignDate(new Date().toLocaleDateString());
  };

  const handlePrint = () => {
    window.print();
  };  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 bg-white border border-slate-200 rounded-sm shadow-sm my-8 font-sans space-y-6 print:border-none print:shadow-none print:my-0 animate-in fade-in duration-200">
      
      {/* Alert note */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-100 text-blue-900 text-xs rounded-sm flex items-start gap-2 print:hidden leading-normal shadow-sm">
        <Info className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Service Agreement Wizard:</strong> Fill in the document variables below, initial your agreement, and simulate print/download layout options. Under the Republic of Burundi Civil Code, accurate filings bind transacting brokers legally.
        </div>
      </div>

      {/* Contract Title */}
      <div className="text-center border-b border-slate-200 pb-5">
        <span className="text-[10px] font-mono font-bold text-blue-700 block uppercase tracking-[0.2em]">Official Document File</span>
        <h1 className="font-sans font-black text-slate-900 text-xl md:text-2xl mt-1 uppercase tracking-wider">IMMO BURUNDI SERVICE AGREEMENT</h1>
        <p className="text-xs text-slate-500 font-mono mt-1">Bujumbura, Republic of Burundi • File Ref: IB-2026-SA</p>
      </div>

      {/* Parties Block */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed">
        {/* Company Party */}
        <div className="bg-slate-50 border border-slate-200 border-l-4 border-l-blue-700 p-4 rounded-sm space-y-2 shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-widest block text-[#64748b] font-extrabold">Company Information</span>
          <div className="text-xs text-slate-700 space-y-1 font-medium">
            <p><strong>Corporate Name:</strong> IMMO BURUNDI Private Limited</p>
            <p><strong>Address:</strong> Boulevard de l'Uprona, Rohero I, Bujumbura, Burundi</p>
            <p><strong>Phone:</strong> +257 22 22 45 45</p>
            <p><strong>Email:</strong> compliance@immoburundi.bi</p>
          </div>
        </div>

        {/* Client Party (Interactive Input or static view) */}
        <div className="bg-blue-50/10 border border-blue-100 border-l-4 border-l-blue-700 p-4 rounded-sm space-y-2 shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-widest block text-blue-800 font-extrabold">Client Information</span>
          {isSigned ? (
            <div className="text-xs text-slate-700 space-y-1 font-medium">
              <p><strong>Client Name:</strong> {clientName}</p>
              <p><strong>Email Address:</strong> {clientEmail}</p>
              <p><strong>Phone Line:</strong> {clientPhone}</p>
              <p><strong>City Residence:</strong> {clientAddress || 'Bujumbura, Burundi'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-[11px] print:hidden">
              <input
                type="text"
                placeholder="Full Legal Name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="col-span-2 bg-white border border-slate-200 rounded-sm p-2 focus:outline-none focus:border-blue-700 font-medium"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="bg-white border border-slate-200 rounded-sm p-2 focus:outline-none focus:border-blue-700 font-medium"
              />
              <input
                type="tel"
                placeholder="Phone line detail"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="bg-white border border-slate-200 rounded-sm p-2 focus:outline-none focus:border-blue-700 font-medium"
              />
              <input
                type="text"
                placeholder="Address Residence (e.g. Kiriri)"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                className="col-span-2 bg-white border border-slate-200 rounded-sm p-2 focus:outline-none focus:border-blue-700 font-medium"
              />
            </div>
          )}
        </div>
      </div>

      {/* Contract body articles */}
      <div className="text-xs text-slate-600 space-y-4 leading-relaxed font-sans border-t border-slate-200 pt-5">
        <div>
          <h3 className="font-extrabold text-slate-900 border-l-4 border-blue-700 pl-2.5 uppercase tracking-wide">4.1 PURPOSE OF AGREEMENT</h3>
          <p className="mt-1">
            This agreement defines the operational parameters under which IMMO BURUNDI provides real estate digital brokerage, listing, promotion, and legal document auditing to the undersigned client relative to their properties listed on the immoburundi.bi workspace.
          </p>
        </div>

        <div>
          <h3 className="font-extrabold text-slate-900 border-l-4 border-blue-700 pl-2.5 uppercase tracking-wide">4.2 CLIENT RESPONSIBILITIES</h3>
          <p className="mt-1">
            The client agrees to provide high-integrity, accurate ownership deeds, certificates, and cadasters without alteration. The client remains exclusively liable criminally and civilly under Burundian Jurisprudence for disputes or losses stemming from hidden third-party claims or forged records.
          </p>
        </div>

        <div>
          <h3 className="font-extrabold text-slate-900 border-l-4 border-blue-700 pl-2.5 uppercase tracking-wide">4.3 ACCREDITED VERIFICATION EXCLUSION</h3>
          <p className="mt-1">
            Verification statuses assigned represent diligent operational checks of presented files at the time of administrative examination and do not constitute government-backed guarantees or future absolute validity. Independent checkups with administrative title registers are strongly mandated.
          </p>
        </div>

        <div>
          <h3 className="font-extrabold text-slate-900 border-l-4 border-blue-700 pl-2.5 uppercase tracking-wide">4.4 PREMIUM FEES & COMMISSIONS STRUCTURE</h3>
          <p className="mt-1 font-semibold text-slate-800">
            * Listing Services: Basic listing is accessible without charge. Verified badges and physical land survey audits carry flat rates of 100,000 BIF ($50 USD equivalent).
            <br />
            * Brokerage commission: The client shall compensate IMMO BURUNDI in the amount of 2.5% of final transacted sales or 1 month's equivalent rent for verified leases concluded by company agents. All balances are due in Burundi Francs (BIF) or United States Dollars (USD).
          </p>
        </div>

        <div>
          <h3 className="font-extrabold text-slate-900 border-l-4 border-blue-700 pl-2.5 uppercase tracking-wide">4.5 GOVERNING LAW</h3>
          <p className="mt-1">
            This bilateral covenant is governed and construed exclusively according to the laws of the Republic of Burundi. Active dispute resolutions shall be filed with the Competent Tribunals of Bujumbura.
          </p>
        </div>
      </div>

      {/* Signatures Panel */}
      <div className="border-t border-slate-200 pt-6 grid grid-cols-2 gap-6 items-end">
        {/* Company Sign block */}
        <div className="space-y-4">
          <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold tracking-wider">IMMO BURUNDI REPRESENTATIVE</span>
          <div className="border-b border-dashed border-slate-300 pb-3 h-14 relative flex items-end">
            <span className="font-serif italic text-blue-700 font-bold ml-2 text-sm">Verification Desk (Approved)</span>
            {/* Stamp logo overlay */}
            <div className="absolute right-2 -bottom-2 w-14 h-14 opacity-30 border-2 border-green-650 rounded-full flex items-center justify-center text-[8px] font-mono text-green-600 font-bold uppercase tracking-widest transform rotate-12">
              Approved
            </div>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Date: {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Client Sign Block */}
        <div className="space-y-4">
          <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold tracking-wider">CLIENT SIGNATURE DIRECTIVE</span>
          
          {isSigned ? (
            <div className="border-b border-dashed border-slate-300 pb-3 h-14 flex items-end">
              <span className="font-sans italic text-slate-800 font-bold ml-2">✍️ Selected Initial: {clientName}</span>
            </div>
          ) : (
            <form onSubmit={handleSignContract} className="flex gap-2 print:hidden items-end">
              <button
                type="submit"
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold p-3 rounded-sm text-[11px] leading-none uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm w-full"
              >
                <PenTool className="w-3.5 h-3.5" />
                Agree & Sign Agreement
              </button>
            </form>
          )}

          <div className="text-[10px] text-slate-500 font-mono">
            Date: {isSigned ? signDate : 'Pending signatures...'}
          </div>
        </div>
      </div>

      {/* Button controls */}
      <div className="border-t border-slate-200 pt-5 flex justify-end gap-3.5 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-300 bg-slate-50 text-slate-700 font-bold rounded-sm text-[11px] uppercase tracking-wider hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Print / Save PDF (Sim)
        </button>
        {isSigned && (
          <div className="bg-green-150 border border-green-300 text-green-800 text-xs px-4 py-2.5 rounded-sm flex items-center font-bold gap-1 animate-pulse">
            <Check className="w-4 h-4" /> Contract Signed successfully!
          </div>
        )}
      </div>

    </div>
  );
}
