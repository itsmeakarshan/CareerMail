import React, { useState } from 'react';
import { X, Send, Sparkles, Wand2 } from 'lucide-react';
import { emailsApi } from '../../services/api';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ComposeEmailModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;

    setLoading(true);
    try {
      await emailsApi.compose({ to, subject, body });
      setSuccessMessage('Email sent successfully!');
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (err: any) {
      alert(`Error sending email: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePreset = async (type: 'applied' | 'interview' | 'offer' | 'rejection') => {
    setLoading(true);
    let sample = {
      sender: 'Google Careers',
      senderEmail: 'recruiting@google.com',
      subject: 'Invitation to Interview: Software Engineer at Google',
      body: 'Hi Arjun,\n\nWe were impressed by your profile and would like to invite you to a technical interview for the Software Engineer role.\n\nPlease select your preferred slot.\n\nBest,\nGoogle Recruiting Team',
      important: true,
    };

    if (type === 'applied') {
      sample = {
        sender: 'Stripe Talent',
        senderEmail: 'recruiting@stripe.com',
        subject: 'Thank you for applying for the Full Stack Engineer position at Stripe',
        body: 'Hi Arjun,\n\nThank you for applying for the Full Stack Engineer role at Stripe. We have received your application and will review it shortly.\n\nBest,\nStripe Recruiting Team',
        important: false,
      };
    } else if (type === 'offer') {
      sample = {
        sender: 'Netflix Talent Acquisition',
        senderEmail: 'offers@netflix.com',
        subject: 'Offer of Employment: Senior Platform Engineer at Netflix',
        body: 'Dear Arjun,\n\nWe are pleased to offer you the position of Senior Platform Engineer at Netflix!\n\nPlease find your formal offer letter attached.\n\nWarm regards,\nNetflix Executive Hiring',
        important: true,
      };
    } else if (type === 'rejection') {
      sample = {
        sender: 'Uber Recruiting',
        senderEmail: 'careers@uber.com',
        subject: 'Update on your Software Engineer application at Uber',
        body: 'Dear Arjun,\n\nAfter careful consideration, we have decided not to proceed with your candidacy for the Software Engineer position.\n\nWe wish you all the best in your search.\n\nUber Talent Acquisition',
        important: false,
      };
    }

    try {
      await emailsApi.simulate(sample);
      setSuccessMessage(`Simulated job email received! Auto-pipeline detected ${sample.sender}.`);
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err: any) {
      alert(`Error simulating email: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#12182b] border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#161e36] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-purple-400" />
            <h3 className="text-base font-bold text-white tracking-tight">New Message</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Simulation Presets Banner */}
        <div className="bg-[#18213a] border-b border-indigo-900/40 p-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Test Real-Time Auto-Job Detection:</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleSimulatePreset('applied')}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-800/50 text-blue-300 hover:bg-blue-900 transition-colors flex items-center gap-1"
            >
              <Wand2 className="w-3 h-3" /> Simulate Stripe Application
            </button>
            <button
              type="button"
              onClick={() => handleSimulatePreset('interview')}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-800/50 text-purple-300 hover:bg-purple-900 transition-colors flex items-center gap-1"
            >
              <Wand2 className="w-3 h-3" /> Simulate Google Interview
            </button>
            <button
              type="button"
              onClick={() => handleSimulatePreset('offer')}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800/50 text-emerald-300 hover:bg-emerald-900 transition-colors flex items-center gap-1"
            >
              <Wand2 className="w-3 h-3" /> Simulate Netflix Offer
            </button>
          </div>
        </div>

        {successMessage && (
          <div className="m-4 p-3 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-xs font-semibold text-emerald-300 text-center animate-fadeIn">
            {successMessage}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSend} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">To</label>
            <input
              type="email"
              placeholder="recruiter@company.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#0c101d] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Subject</label>
            <input
              type="text"
              required
              placeholder="e.g. Following up on Software Engineer application"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#0c101d] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Body</label>
            <textarea
              required
              rows={6}
              placeholder="Write your email here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#0c101d] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <span className="text-xs text-slate-500">CareerMail Email Engine</span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-glow-purple disabled:opacity-50 flex items-center gap-2 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Sending...' : 'Send Email'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
