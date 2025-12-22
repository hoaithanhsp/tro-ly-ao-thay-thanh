import React, { useState, useEffect } from 'react';
import { X, Key, Check, ExternalLink, Settings } from 'lucide-react';
import { MODEL_LIST, DEFAULT_MODEL } from '../constants';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave }) => {
    const [apiKey, setApiKey] = useState('');
    const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const storedKey = localStorage.getItem('gemini_api_key');
            if (storedKey) setApiKey(storedKey);

            const storedModel = localStorage.getItem('preferred_model');
            if (storedModel) setSelectedModel(storedModel);
        }
    }, [isOpen]);

    const handleSave = () => {
        if (!apiKey.trim()) {
            alert("Vui lòng nhập API Key!");
            return;
        }
        localStorage.setItem('gemini_api_key', apiKey.trim());
        localStorage.setItem('preferred_model', selectedModel);

        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
            onSave(); // Trigger parent update/close
            onClose();
        }, 1000);
    };

    const handleClear = () => {
        localStorage.removeItem('gemini_api_key');
        setApiKey('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2 text-gray-800">
                        <Settings className="w-5 h-5 text-primary" />
                        <h2 className="font-bold text-lg">Cài đặt AI & API Key</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">

                    {/* Section 1: Select Model */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            1. Chọn Model AI (Trí tuệ nhân tạo)
                            <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Khuyên dùng</span>
                        </label>
                        <div className="grid grid-cols-1 gap-3">
                            {MODEL_LIST.map((model) => (
                                <button
                                    key={model.id}
                                    onClick={() => setSelectedModel(model.id)}
                                    className={`
                            relative flex items-center p-3 rounded-xl border-2 transition-all text-left
                            ${selectedModel === model.id
                                            ? 'border-primary bg-green-50/50 shadow-sm'
                                            : 'border-gray-100 bg-white hover:border-gray-300'
                                        }
                        `}
                                >
                                    <div className={`
                            w-4 h-4 rounded-full border mr-3 flex items-center justify-center
                            ${selectedModel === model.id ? 'border-primary bg-primary' : 'border-gray-300'}
                        `}>
                                        {selectedModel === model.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </div>
                                    <div>
                                        <span className={`block font-medium ${selectedModel === model.id ? 'text-primary' : 'text-gray-700'}`}>
                                            {model.name}
                                        </span>
                                    </div>
                                    {model.id === DEFAULT_MODEL && (
                                        <span className="absolute right-3 top-3 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                                            Mặc định
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-100 my-2"></div>

                    {/* Section 2: API Key */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-semibold text-gray-700">2. Nhập Gemini API Key</label>
                            <a
                                href="https://tinyurl.com/APIKEYTHT"
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                                Xem hướng dẫn lấy Key <ExternalLink size={12} />
                            </a>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-800 flex gap-2">
                            <span className="text-xl">💡</span>
                            <p>
                                Bạn chưa có key? Truy cập <a href="https://aistudio.google.com/api-keys" target="_blank" className="font-bold underline">Google AI Studio</a> để lấy key miễn phí nhé.
                            </p>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Key size={18} />
                            </div>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Dán API Key của bạn vào đây (bắt đầu bằng AIza...)"
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all font-mono text-sm"
                            />
                        </div>

                        {apiKey && (
                            <button
                                onClick={handleClear}
                                className="text-xs text-red-500 hover:text-red-700 hover:underline"
                            >
                                Xóa key đã lưu
                            </button>
                        )}
                    </div>

                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-gray-600 hover:bg-gray-200 font-medium transition-colors"
                    >
                        Đóng
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={showSuccess}
                        className={`
                    px-6 py-2.5 rounded-xl text-white font-bold shadow-lg shadow-glow flex items-center gap-2 transition-all transform active:scale-95
                    ${showSuccess ? 'bg-green-500' : 'bg-gradient-to-r from-primary to-secondary hover:brightness-110'}
                `}
                    >
                        {showSuccess ? (
                            <>
                                <Check size={18} /> Đã lưu thành công!
                            </>
                        ) : (
                            "Lưu cài đặt"
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ApiKeyModal;
