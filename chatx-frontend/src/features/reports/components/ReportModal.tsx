import React, { useState } from 'react';
import reportApi from '../services/reportApi';
import { ReportReason, ReportTargetType } from '../../../types/report';
import { AlertTriangle, X, Loader2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetLabel,
}) => {
  const [reason, setReason] = useState<ReportReason>('SPAM');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await reportApi.submitReport({
        targetType,
        targetId,
        reason,
        details: details.trim() || undefined,
      });

      toast.success('Report submitted. Thank you for helping keep ChatX safe.');
      onClose();
      setDetails('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-chatx-surface border border-chatx-border shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-chatx-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-chatx-danger/10 border border-chatx-danger/20 flex items-center justify-center text-chatx-danger">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Report Content</h3>
              <p className="text-xs text-chatx-text-secondary">
                Reporting {targetType.toLowerCase()} {targetLabel ? `"${targetLabel}"` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-chatx-text-secondary hover:text-white hover:bg-chatx-card transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-chatx-text mb-1.5">
              Reason for reporting
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="input-field text-xs py-2.5 w-full bg-chatx-card"
            >
              <option value="SPAM">Spam or unwanted advertising</option>
              <option value="HARASSMENT">Harassment or bullying</option>
              <option value="INAPPROPRIATE_CONTENT">Inappropriate or offensive media</option>
              <option value="HATE_SPEECH">Hate speech or discrimination</option>
              <option value="OTHER">Other violation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-chatx-text mb-1.5">
              Additional Details (optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any relevant context for the moderation team..."
              rows={4}
              className="input-field text-xs py-2 w-full resize-none bg-chatx-card"
              maxLength={1000}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-chatx-text-secondary hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-chatx-danger hover:bg-chatx-danger/90 text-white flex items-center gap-1.5 shadow-lg shadow-chatx-danger/20 transition-all"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              <span>Submit Report</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
