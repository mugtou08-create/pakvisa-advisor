'use client';

import React, { useState } from 'react';
import { Send, Mail, User, MessageSquare, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in name, email, and message');
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSending(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      let data: any;
      try {
        data = await res.json();
      } catch {
        console.error('Contact form: non-JSON response, status:', res.status);
        toast.error('Server returned an unexpected response. Please try again.');
        return;
      }
      if (res.ok && data.success) {
        toast.success(data.message || 'Message sent successfully!');
        setSent(true);
        setName(''); setEmail(''); setSubject(''); setMessage('');
        setTimeout(() => setSent(false), 5000);
      } else if (res.status === 429) {
        toast.error(data.message || 'Too many messages. Please wait a few minutes.');
      } else {
        toast.error(data.message || 'Failed to send message. Please try again.');
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        toast.error('Request timed out. Please check your connection and try again.');
      } else {
        console.error('Contact form submission error:', err);
        toast.error('Could not send message. Please check your connection and try again.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Mail className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <p className="text-sm text-muted-foreground">Have a question? We will get back to you within 24 hours.</p>
          </div>
        </div>

        {sent ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h4 className="font-semibold text-lg">Message Sent!</h4>
            <p className="text-sm text-muted-foreground mt-1">Thank you for reaching out. We will respond shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-name" className="text-sm font-medium">
                  <User className="w-3.5 h-3.5 inline mr-1" /> Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contact-name"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email" className="text-sm font-medium">
                  <Mail className="w-3.5 h-3.5 inline mr-1" /> Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={200}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-subject" className="text-sm font-medium">
                <MessageSquare className="w-3.5 h-3.5 inline mr-1" /> Subject <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="contact-subject"
                placeholder="e.g. Visa question about Turkey"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-message" className="text-sm font-medium">
                Message <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="contact-message"
                placeholder="Tell us how we can help you..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={2000}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">{message.length}/2000</p>
            </div>
            <Button
              type="submit"
              disabled={sending}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {sending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Send Message</>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
