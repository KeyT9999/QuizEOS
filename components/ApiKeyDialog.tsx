import React, { useState, useEffect } from 'react';
import { XCircle, Key, ExternalLink } from 'lucide-react';

interface ApiKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  errorMessage?: string; // Thông báo lỗi nếu API key sai
}

export const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ isOpen, onClose, onSave, errorMessage }) => {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState(errorMessage || '');
  
  // Update error when errorMessage prop changes
  React.useEffect(() => {
    if (errorMessage) {
      setError(errorMessage);
    }
  }, [errorMessage]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      setError('Vui lòng nhập API key');
      return;
    }
    onSave(trimmedKey);
    setApiKey('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setApiKey('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex justify-between items-center shrink-0">
          <h3 className="text-white font-bold flex items-center gap-2 text-lg">
            <Key size={20} className="text-yellow-300" /> 
            Nhập Gemini API Key
          </h3>
          <button 
            onClick={handleClose}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError('');
              }}
              placeholder="Nhập API key của bạn..."
              className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 ${
                error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
              }`}
              autoFocus
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
            <p className="font-semibold mb-1">Làm thế nào để lấy API key?</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Truy cập <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">Google AI Studio <ExternalLink size={12} /></a></li>
              <li>Đăng nhập bằng tài khoản Google của bạn</li>
              <li>Tạo API key mới hoặc sử dụng API key có sẵn</li>
              <li>Sao chép và dán vào ô trên</li>
            </ol>
          </div>

          {error && error.includes('API') && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
              <p className="font-semibold mb-1">⚠️ API Key không hợp lệ</p>
              <p className="text-xs">{error}</p>
            </div>
          )}
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
            <p className="font-semibold mb-1">Lưu ý bảo mật:</p>
            <p className="text-xs">API key của bạn sẽ được lưu trữ cục bộ trên trình duyệt của bạn và chỉ được sử dụng để gọi API Gemini. Chúng tôi không lưu trữ hoặc gửi API key của bạn đến bất kỳ server nào.</p>
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2 shrink-0">
          <button 
            onClick={handleClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-md font-semibold text-sm transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={handleSave}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white px-5 py-2 rounded-md font-semibold text-sm transition-opacity flex items-center gap-2"
          >
            <Key size={16} />
            Lưu API Key
          </button>
        </div>
      </div>
    </div>
  );
};

