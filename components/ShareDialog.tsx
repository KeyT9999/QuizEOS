import React, { useState, useEffect } from 'react';
import { XCircle, Share2, Copy, Check } from 'lucide-react';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string;
  quizTitle: string;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({ isOpen, onClose, quizId, quizTitle }) => {
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const url = `${window.location.origin}/quiz/${quizId}`;
      setShareUrl(url);
      setCopied(false);
    }
  }, [isOpen, quizId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex justify-between items-center shrink-0">
          <h3 className="text-white font-bold flex items-center gap-2 text-lg">
            <Share2 size={20} className="text-yellow-300" /> 
            Chia sẻ Quiz
          </h3>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Quiz: <span className="font-bold">{quizTitle}</span>
            </p>
            <p className="text-xs text-green-600 mb-4 flex items-center gap-1">
              <Check size={14} />
              Quiz đã được đánh dấu công khai. Mọi người có thể truy cập qua link này.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link chia sẻ
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 p-3 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-3 rounded-md font-semibold text-sm transition-colors flex items-center gap-2 ${
                  copied 
                    ? 'bg-green-500 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    Đã copy!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
            <p className="font-semibold mb-1">💡 Hướng dẫn:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Click nút "Copy" để sao chép link</li>
              <li>Gửi link này cho bất kỳ ai bạn muốn</li>
              <li>Người nhận có thể mở link và làm quiz ngay</li>
              <li>Không cần đăng nhập để xem quiz công khai</li>
            </ul>
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-md font-semibold text-sm transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

