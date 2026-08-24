'use client';

import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';

const FALLBACK_NUMBER = '';
const MESSAGE = encodeURIComponent('Hi! I have a question about visa requirements for Pakistani passport holders. (Text message only, please — no calls)');

export function WhatsAppButton() {
  const [number, setNumber] = useState<string>(FALLBACK_NUMBER);

  useEffect(() => {
    fetch('/api/public-settings')
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data?.whatsapp_number) {
          setNumber(res.data.whatsapp_number);
        }
      })
      .catch(() => {});
  }, []);

  // Don't render if no WhatsApp number is configured
  if (!number) return null;

  const url = `https://wa.me/${number}?text=${MESSAGE}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full pl-4 pr-5 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="text-sm font-semibold hidden sm:inline">Chat on WhatsApp</span>
    </a>
  );
}
