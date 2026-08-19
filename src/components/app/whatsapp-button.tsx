'use client';

import { MessageCircle } from 'lucide-react';

export function WhatsAppButton() {
  // Replace with your actual WhatsApp number (with country code, no +)
  // Example: '923001234567' for Pakistan
  const WHATSAPP_NUMBER = '923001234567';
  const message = encodeURIComponent('Hi! I have a question about visa requirements for Pakistani passport holders.');
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full pl-4 pr-5 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="text-sm font-semibold hidden sm:inline">Chat on WhatsApp</span>
    </a>
  );
}
