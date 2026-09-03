import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest, isProUser } from '@/lib/auth';

// GET /api/timeline — Get all timelines for the logged-in user
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const timelines = await db.visaTimeline.findMany({
      where: { userId: user.id, isActive: true },
      include: {
        steps: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: timelines });
  } catch (error) {
    console.error('[timeline] GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch timelines' }, { status: 500 });
  }
}

// POST /api/timeline — Create or update a timeline
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const pro = isProUser(user);
    if (!pro) {
      return NextResponse.json({ success: false, error: 'Pro membership required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, timelineId, data } = body as {
      action: 'create' | 'update' | 'update_step' | 'delete';
      timelineId?: string;
      data?: Record<string, unknown>;
    };

    if (action === 'create') {
      // Create new timeline with steps
      const { countryCode, countryName, startDate, whatsappNumber, reminderFrequency, steps } = data || {};
      if (!countryCode || !countryName) {
        return NextResponse.json({ success: false, error: 'countryCode and countryName are required' }, { status: 400 });
      }

      const timeline = await db.visaTimeline.create({
        data: {
          userId: user.id,
          countryCode: String(countryCode),
          countryName: String(countryName),
          startDate: String(startDate || new Date().toISOString().split('T')[0]),
          whatsappNumber: String(whatsappNumber || ''),
          reminderFrequency: String(reminderFrequency || '2days'),
          steps: {
            create: Array.isArray(steps)
              ? steps.map((s: Record<string, unknown>, i: number) => ({
                  stepKey: String(s.id || `step-${i}`),
                  title: String(s.title || ''),
                  description: String(s.description || ''),
                  typicalDaysMin: Number(s.typicalDaysMin || 0),
                  typicalDaysMax: Number(s.typicalDaysMax || 0),
                  isCompleted: Boolean(s.isCompleted),
                  completedDate: String(s.completedDate || ''),
                  dueDate: String(s.dueDate || ''),
                  tips: JSON.stringify(s.tips || []),
                  requiredDocs: JSON.stringify(s.requiredDocs || []),
                  sortOrder: i,
                }))
              : [],
          },
        },
        include: { steps: { orderBy: { sortOrder: 'asc' } } },
      });

      return NextResponse.json({ success: true, data: timeline });
    }

    if (action === 'update_step') {
      // Update a single step (toggle completion, set due date, etc.)
      if (!timelineId) {
        return NextResponse.json({ success: false, error: 'timelineId is required' }, { status: 400 });
      }

      // Verify ownership
      const existing = await db.visaTimeline.findUnique({ where: { id: timelineId } });
      if (!existing || existing.userId !== user.id) {
        return NextResponse.json({ success: false, error: 'Timeline not found' }, { status: 404 });
      }

      const { stepKey, isCompleted, completedDate, dueDate } = data || {};

      // Find the step by stepKey
      const step = await db.timelineStep.findFirst({
        where: { timelineId, stepKey: String(stepKey) },
      });

      if (!step) {
        return NextResponse.json({ success: false, error: 'Step not found' }, { status: 404 });
      }

      const updatedStep = await db.timelineStep.update({
        where: { id: step.id },
        data: {
          ...(isCompleted !== undefined && { isCompleted: Boolean(isCompleted) }),
          ...(completedDate !== undefined && { completedDate: String(completedDate) }),
          ...(dueDate !== undefined && { dueDate: String(dueDate) }),
        },
      });

      return NextResponse.json({ success: true, data: updatedStep });
    }

    if (action === 'update') {
      // Update timeline metadata (WhatsApp, frequency, etc.)
      if (!timelineId) {
        return NextResponse.json({ success: false, error: 'timelineId is required' }, { status: 400 });
      }

      const existing = await db.visaTimeline.findUnique({ where: { id: timelineId } });
      if (!existing || existing.userId !== user.id) {
        return NextResponse.json({ success: false, error: 'Timeline not found' }, { status: 404 });
      }

      const { whatsappNumber, whatsappVerified, reminderFrequency, isActive } = data || {};

      const updated = await db.visaTimeline.update({
        where: { id: timelineId },
        data: {
          ...(whatsappNumber !== undefined && { whatsappNumber: String(whatsappNumber) }),
          ...(whatsappVerified !== undefined && { whatsappVerified: Boolean(whatsappVerified) }),
          ...(reminderFrequency !== undefined && { reminderFrequency: String(reminderFrequency) }),
          ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        },
        include: { steps: { orderBy: { sortOrder: 'asc' } } },
      });

      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'delete') {
      if (!timelineId) {
        return NextResponse.json({ success: false, error: 'timelineId is required' }, { status: 400 });
      }

      const existing = await db.visaTimeline.findUnique({ where: { id: timelineId } });
      if (!existing || existing.userId !== user.id) {
        return NextResponse.json({ success: false, error: 'Timeline not found' }, { status: 404 });
      }

      await db.visaTimeline.delete({ where: { id: timelineId } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[timeline] POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process timeline request' }, { status: 500 });
  }
}
