import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const note = (formData.get('note') as string | null)?.trim() || '';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: 'File too large. Maximum size is 5MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'payment-proofs');
    await mkdir(uploadDir, { recursive: true });

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${user.id}_${timestamp}_${safeName}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    const proof = await db.paymentProof.create({
      data: {
        userId: user.id,
        fileName: file.name,
        filePath: `/uploads/payment-proofs/${fileName}`,
        fileSize: file.size,
        userNote: note,
        status: 'pending',
      },
    });

    // Create admin notification
    await db.adminNotification.create({
      data: {
        type: 'payment_proof',
        title: 'New Payment Proof Uploaded',
        message: `${user.fullName || user.email} (${user.email}) uploaded a payment proof.`,
        data: JSON.stringify({ proofId: proof.id, userId: user.id }),
      },
    });

    return NextResponse.json({
      success: true,
      data: { id: proof.id, message: 'Payment proof submitted successfully' },
    });
  } catch (error) {
    console.error('Payment proof upload error:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload payment proof' }, { status: 500 });
  }
}
