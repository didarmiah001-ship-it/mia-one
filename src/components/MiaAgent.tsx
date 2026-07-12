import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Phone, Mail, Send, Paperclip, Headphones, Package, Truck, CreditCard, MapPin, Store, MessageCircle } from 'lucide-react';
import { appConfig } from '../lib/config';
import { getMiaResponse, getFallbackResponse } from '../lib/mia-kb';
import { useTranslation } from 'react-i18next';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface MiaAgentProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_ACTIONS = [
  { icon: Package, labelBn: 'আমার অর্ডার', labelEn: 'My Orders', color: '#FF8A00', queryBn: 'আমার অর্ডার ট্র্যাক করতে চাই', queryEn: 'I want to track my order' },
  { icon: Truck, labelBn: 'ডেলিভারি', labelEn: 'Delivery', color: '#00D1FF', queryBn: 'ডেলিভারি সম্পর্কে জানতে চাই', queryEn: 'Tell me about delivery' },
  { icon: CreditCard, labelBn: 'পেমেন্ট', labelEn: 'Payment', color: '#7B2CFF', queryBn: 'পেমেন্ট পদ্ধতি কি আছে?', queryEn: 'What payment methods are available?' },
  { icon: MapPin, labelBn: 'আমাদের ঠিকানা', labelEn: 'Our Address', color: '#FF2EC9', queryBn: 'আমাদের ঠিকানা কোথায়?', queryEn: 'Where is your address?' },
  { icon: Store, labelBn: 'পাইকারি অর্ডার', labelEn: 'Wholesale', color: '#22C55E', queryBn: 'পাইকারি অর্ডার সম্পর্কে জানতে চাই', queryEn: 'I want to know about wholesale orders' },
  { icon: Phone, labelBn: 'কল করুন', labelEn: 'Call Now', color: '#00D1FF', action: 'call' },
  { icon: MessageCircle, labelBn: 'WhatsApp', labelEn: 'WhatsApp', color: '#25D366', action: 'whatsapp' },
  { icon: Mail, labelBn: 'ইমেইল', labelEn: 'Email', color: '#FF8A00', action: 'email' },
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function MiaAgent({ isOpen, onClose }: MiaAgentProps) {
  const { i18n } = useTranslation();
  const isBangla = i18n.language === 'bn';
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Welcome message
      const welcomeText = isBangla
        ? '👋 আসসালামু আলাইকুম।\nMIA ONE-এ আপনাকে স্বাগতম।\nআমি MIA Agent।\n\nআপনাকে কীভাবে সাহায্য করতে পারি?'
        : '👋 Assalamu Alaikum.\nWelcome to MIA ONE.\nI am MIA Agent.\n\nHow can I help you today?';

      setMessages([{
        id: generateId(),
        text: welcomeText,
        isUser: false,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, messages.length, isBangla]);

  const handleSendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: generateId(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const response = getMiaResponse(text, isBangla);
      const botText = response || getFallbackResponse(isBangla);

      const botMessage: Message = {
        id: generateId(),
        text: botText,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 800 + Math.random() * 500);
  }, [isBangla]);

  const handleQuickAction = useCallback((action: typeof QUICK_ACTIONS[0]) => {
    if (action.action === 'call') {
      window.open(appConfig.support.phoneUrl, '_self');
      return;
    }
    if (action.action === 'whatsapp') {
      window.open(appConfig.support.whatsappUrl, '_blank');
      return;
    }
    if (action.action === 'email') {
      window.open(appConfig.support.emailUrl, '_self');
      return;
    }

    const query = isBangla ? action.queryBn : action.queryEn;
    handleSendMessage(query || '');
  }, [handleSendMessage, isBangla]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Chat Container */}
      <div className="relative flex flex-col flex-1 mx-auto w-full max-w-lg bg-gradient-to-b from-[#0D1117] to-[#0A0A0F] overflow-hidden">
        {/* Header */}
        <header className="relative flex items-center justify-between px-4 py-4 border-b border-white/5" style={{
          background: 'linear-gradient(180deg, rgba(13,17,23,0.98) 0%, rgba(10,10,15,0.95) 100%)',
        }}>
          {/* Ambient glow */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[2px] rounded-full"
            style={{ background: 'linear-gradient(90deg, transparent, #FF8A00, #FF2EC9, #00D1FF, transparent)' }} />

          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FF8A00] to-[#FF2EC9] opacity-40 blur-sm animate-pulse" />
              <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-[#FF8A00]/30">
                <img
                  src="/ChatGPT_Image_Jun_26,_2026,_11_55_37_PM.png"
                  alt="MIA Agent"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0D1117] neon-pulse" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">MIA Agent</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 neon-pulse" />
                <span className="text-xs text-green-400">
                  {isBangla ? 'অনলাইন' : 'Online'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(appConfig.support.phoneUrl, '_self')}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-[#00D1FF]/10"
              style={{ background: 'rgba(0,209,255,0.08)', border: '1px solid rgba(0,209,255,0.15)' }}
            >
              <Phone size={16} className="text-[#00D1FF]" />
            </button>
            <button
              onClick={() => window.open(appConfig.support.whatsappUrl, '_blank')}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-[#25D366]/10"
              style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.15)' }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366]">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </button>
            <button
              onClick={() => window.open(appConfig.support.emailUrl, '_self')}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-[#FF8A00]/10"
              style={{ background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.15)' }}
            >
              <Mail size={16} className="text-[#FF8A00]" />
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 rotate-hover"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <X size={16} className="text-white/60" />
            </button>
          </div>
        </header>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="px-3 py-3 border-b border-white/5">
            <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-2 px-1">
              {isBangla ? 'দ্রুত অ্যাকশন' : 'Quick Actions'}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_ACTIONS.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleQuickAction(action)}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
                    style={{
                      background: `${action.color}08`,
                      border: `1px solid ${action.color}15`,
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300"
                      style={{
                        backgroundColor: `${action.color}15`,
                        border: `1px solid ${action.color}20`,
                      }}
                    >
                      <Icon size={16} style={{ color: action.color }} />
                    </div>
                    <span className="text-[9px] font-medium text-white/70 text-center leading-tight" style={{ color: `${action.color}cc` }}>
                      {isBangla ? action.labelBn : action.labelEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ background: 'transparent' }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!msg.isUser && (
                <div className="w-7 h-7 rounded-full overflow-hidden mr-2 shrink-0 border border-[#FF8A00]/20">
                  <img
                    src="/ChatGPT_Image_Jun_26,_2026,_11_55_37_PM.png"
                    alt="MIA"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                  msg.isUser
                    ? 'bg-gradient-to-br from-[#FF8A00] to-[#FF2EC9] text-white rounded-tr-md'
                    : 'rounded-tl-md'
                }`}
                style={!msg.isUser ? {
                  background: 'linear-gradient(135deg, rgba(20,24,32,0.95), rgba(13,17,23,0.98))',
                  border: '1px solid rgba(255,138,0,0.12)',
                  color: 'rgba(255,255,255,0.9)',
                } : undefined}
              >
                <p className="text-[13px] leading-relaxed whitespace-pre-line">{msg.text}</p>
                <p
                  className={`text-[9px] mt-1.5 ${
                    msg.isUser ? 'text-white/60' : 'text-white/30'
                  }`}
                >
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start items-center gap-2">
              <div className="w-7 h-7 rounded-full overflow-hidden border border-[#FF8A00]/20">
                <img
                  src="/ChatGPT_Image_Jun_26,_2026,_11_55_37_PM.png"
                  alt="MIA"
                  className="w-full h-full object-cover"
                />
              </div>
              <div
                className="rounded-2xl rounded-tl-md px-4 py-3"
                style={{
                  background: 'linear-gradient(135deg, rgba(20,24,32,0.95), rgba(13,17,23,0.98))',
                  border: '1px solid rgba(255,138,0,0.12)',
                }}
              >
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#FF8A00]/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#FF2EC9]/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#00D1FF]/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Fallback Contact Buttons - shown when bot gives fallback response */}
          {messages.length > 1 && !isTyping && messages[messages.length - 1]?.text.includes(isBangla ? 'দুঃখিত' : 'Sorry') && (
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => window.open(appConfig.support.whatsappUrl, '_blank')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, rgba(37,211,102,0.15), rgba(37,211,102,0.08))',
                  border: '1px solid rgba(37,211,102,0.25)',
                  color: '#25D366',
                }}
              >
                <MessageCircle size={16} />
                {isBangla ? 'WhatsApp সাপোর্ট' : 'WhatsApp Support'}
              </button>
              <button
                onClick={() => window.open(appConfig.support.phoneUrl, '_self')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,209,255,0.15), rgba(0,209,255,0.08))',
                  border: '1px solid rgba(0,209,255,0.25)',
                  color: '#00D1FF',
                }}
              >
                <Phone size={16} />
                {isBangla ? 'এখনই কল করুন' : 'Call Now'}
              </button>
              <button
                onClick={() => window.open(appConfig.support.emailUrl, '_self')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,138,0,0.15), rgba(255,138,0,0.08))',
                  border: '1px solid rgba(255,138,0,0.25)',
                  color: '#FF8A00',
                }}
              >
                <Mail size={16} />
                {isBangla ? 'ইমেইল সাপোর্ট' : 'Email Support'}
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-3 py-3 border-t border-white/5" style={{
          background: 'linear-gradient(180deg, rgba(10,10,15,0.98) 0%, rgba(13,17,23,0.99) 100%)',
        }}>
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <button
              type="button"
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 hover:scale-105"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Paperclip size={16} className="text-white/40" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isBangla ? 'আপনার মেসেজ লিখুন...' : 'Type your message...'}
              className="flex-1 h-10 px-4 rounded-xl text-[13px] text-white placeholder-white/30 outline-none transition-all duration-300 focus:border-[#FF8A00]/40"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 glow-btn"
              style={{
                background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)',
                border: 'none',
              }}
            >
              <Send size={16} className="text-white" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Floating Button Component
export function MiaAgentFloatingButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed z-[55] w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group"
      style={{
        bottom: 'calc(128px + env(safe-area-inset-bottom, 0px))',
        right: '24px',
        background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)',
        boxShadow: '0 0 30px rgba(255,138,0,0.4), 0 0 60px rgba(255,46,201,0.25), 0 8px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Outer glow ring */}
      <div
        className="absolute inset-0 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'transparent',
          boxShadow: '0 0 20px rgba(255,138,0,0.5), 0 0 40px rgba(255,46,201,0.3)',
        }}
      />

      {/* Pulse animation */}
      <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{
        background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)',
      }} />

      {/* Rotating gradient border */}
      <div
        className="absolute -inset-1 rounded-full opacity-40 z-[-1]"
        style={{
          background: 'conic-gradient(from 0deg, #FF8A00, #FF2EC9, #7B2CFF, #00D1FF, #FF8A00)',
          animation: 'rotate-glow 2s linear infinite',
        }}
      />

      {/* Inner container */}
      <div className="relative w-[52px] h-[52px] rounded-full overflow-hidden bg-black/20 flex items-center justify-center">
        <img
          src="/ChatGPT_Image_Jun_26,_2026,_11_55_37_PM.png"
          alt="MIA Agent"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <Headphones size={28} className="text-white hidden" />
      </div>

      {/* Online indicator */}
      <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0A0A0F] neon-pulse" />
    </button>
  );
}
