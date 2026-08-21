import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function validateToken(token: string): { valid: boolean; username?: string } {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [id, username] = decoded.split(':');
    if (!id || !username) return { valid: false };
    const timestamp = parseInt(decoded.split(':')[3]);
    if (!timestamp || Date.now() - timestamp > 604800000) return { valid: false };
    return { valid: true, username };
  } catch {
    return { valid: false };
  }
}

function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const validation = validateToken(token);
  return validation.valid ? token : null;
}

export async function GET(request: NextRequest) {
  try {
    const token = authenticate(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [proofs, total] = await Promise.all([
      db.paymentProof.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, fullName: true, phone: true, role: true, proExpiresAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.paymentProof.count({ where }),
    ]);

    const pendingCount = await db.paymentProof.count({ where: { status: 'pending' } });

    return NextResponse.json({
      success: true,
      data: { proofs, total, pendingCount, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Admin payment proofs error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch payment proofs' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = authenticate(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, action, adminNote, durationDays } = body;

    if (!id || !action) {
      return NextResponse.json({ success: false, error: 'Proof ID and action are required' }, { status: 400 });
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ success: false, error: 'Action must be approve or reject' }, { status: 400 });
    }

    const proof = await db.paymentProof.findUnique({ where: { id }, include: { user: true } });
    if (!proof) {
      return NextResponse.json({ success: false, error: 'Payment proof not found' }, { status: 404 });
    }

    if (proof.status !== 'pending') {
      return NextResponse.json({ success: false, error: 'Proof has already been reviewed' }, { status: 400 });
    }

    if (action === 'approve') {
      const days = durationDays || 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      await db.$transaction([
        db.paymentProof.update({
          where: { id },
          data: { status: 'approved', reviewedAt: new Date(), adminNote: adminNote || '' },
        }),
        db.user.update({
          where: { id: proof.userId },
          data: { role: 'pro', proExpiresAt: expiresAt },
        }),
      ]);
    } else {
      await db.paymentProof.update({
        where: { id },
        data: { status: 'rejected', reviewedAt: new Date(), adminNote: adminNote || '' },
      });
    }

    return NextResponse.json({ success: true, message: `Proof ${action}d successfully` });
  } catch (error) {
    console.error('Admin payment proof update error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update payment proof' }, { status: 500 });
  }
}
