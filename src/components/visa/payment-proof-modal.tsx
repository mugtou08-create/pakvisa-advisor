'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Loader2, CheckCircle2, Camera, FileImage, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/auth-store';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PaymentProofModal({ onClose }: { onClose: () => void }) {
  const { token, user, latestProof, checkAuth } = useAuthStore();
  const [waNumber, setWaNumber] = useState('');

  useEffect(() => {
    fetch('/api/public-settings')
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data?.whatsapp_number) {
          setWaNumber(res.data.whatsapp_number);
        }
      })
      .catch(() => {});
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((f: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowed.includes(f.type)) {
      toast.error('Invalid file type. Only JPG, PNG, and WebP are allowed.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removeFile = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    if (!token) {
      toast.error('Please log in first');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (note.trim()) formData.append('note', note.trim());

      const res = await fetch('/api/payment-proof', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Upload failed');
        return;
      }

      setSuccess(true);
      checkAuth(); // Refresh to get updated latestProof status
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-card rounded-2xl border flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 pb-4 shrink-0">
          <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary shrink-0">
            <Upload className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold flex-1">Proof of Payment</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 pb-6 overflow-y-auto">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold">Proof of Payment Submitted!</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We have received your proof of payment. Our team will verify it and activate your Pro features within 24 hours.
              </p>
              {waNumber && (
                <Button
                  variant="outline"
                  className="mt-4 gap-2 text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => window.open('https://wa.me/' + waNumber + '?text=' + encodeURIComponent('New payment proof from ' + user?.fullName + ' (' + user?.email + '). Please check admin dashboard.'), '_blank')}
                >
                  <MessageCircle className="w-4 h-4" /> Notify via WhatsApp
                </Button>
              )}
              <div className="pt-2">
                <Button onClick={onClose} className="bg-emerald-600 hover:bg-emerald-700">
                  Got it
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Existing proof status */}
              {latestProof?.status === 'pending' && (
                <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">You already have a proof under review</p>
                  <p className="text-xs text-muted-foreground mt-1">Submitted on {new Date(latestProof.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. We'll activate your Pro access within 24 hours.</p>
                </div>
              )}
              {latestProof?.status === 'rejected' && (
                <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">Previous proof was rejected</p>
                  {latestProof.adminNote && <p className="text-xs text-muted-foreground mt-1">Reason: {latestProof.adminNote}</p>}
                  <p className="text-xs text-muted-foreground mt-1">Please upload a new, clearer screenshot below.</p>
                </div>
              )}

              {/* File Upload Area */}
              <div className="space-y-2">
                <Label>Payment Screenshot</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                {file && preview ? (
                  <div className="relative border rounded-xl p-3 bg-muted/30">
                    <div className="flex items-center gap-3">
                      {preview && (
                        <img src={preview} alt="Preview" className="w-14 h-14 rounded-lg object-cover border" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <FileImage className="w-4 h-4 text-muted-foreground shrink-0" />
                          <p className="text-sm font-medium truncate">{file.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatFileSize(file.size)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-500"
                        onClick={removeFile}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      dragOver
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10'
                        : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Camera className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Click or drag to upload your payment screenshot</p>
                        <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, WebP (max 5MB)</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label htmlFor="proof-note">Add a note (optional)</Label>
                <Textarea
                  id="proof-note"
                  placeholder='e.g., "Sent via HBL, reference #12345"'
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>

              {/* Submit */}
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={handleSubmit}
                disabled={loading || !file}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" /> Submit Proof of Payment</>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
