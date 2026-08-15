import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function safeJsonParse(str: string): any {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

// GET: Return sessions for a user profile
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userProfileId = searchParams.get('userProfileId');

    if (!userProfileId) {
      return NextResponse.json(
        { success: false, error: 'userProfileId query parameter is required' },
        { status: 400 }
      );
    }

    // Verify the profile exists
    const profile = await db.userProfile.findUnique({
      where: { id: userProfileId },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: `UserProfile with id '${userProfileId}' not found` },
        { status: 404 }
      );
    }

    const sessions = await db.session.findMany({
      where: { userProfileId },
      orderBy: { updatedAt: 'desc' },
      include: {
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    // Parse JSON fields
    const formattedSessions = sessions.map((s) => ({
      ...s,
      answers: safeJsonParse(s.answers),
      scores: safeJsonParse(s.scores),
    }));

    return NextResponse.json({
      success: true,
      data: formattedSessions,
      total: formattedSessions.length,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sessions', ...(process.env.NODE_ENV !== 'production' ? { details: String(error) } : {}) },
      { status: 500 }
    );
  }
}

// POST: Create a new session or update existing one
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userProfileId,
      sessionId,
      answers,
      scores,
      status,
      currentStep,
      questionnaireProgress,
    } = body;

    if (!userProfileId) {
      return NextResponse.json(
        { success: false, error: 'userProfileId is required' },
        { status: 400 }
      );
    }

    // Verify the profile exists
    const profile = await db.userProfile.findUnique({
      where: { id: userProfileId },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: `UserProfile with id '${userProfileId}' not found` },
        { status: 404 }
      );
    }

    // If sessionId is provided, update existing session
    if (sessionId) {
      const existingSession = await db.session.findUnique({
        where: { id: sessionId },
      });

      if (!existingSession) {
        return NextResponse.json(
          { success: false, error: `Session with id '${sessionId}' not found` },
          { status: 404 }
        );
      }

      const updatedSession = await db.session.update({
        where: { id: sessionId },
        data: {
          ...(status && { status }),
          ...(answers && { answers: JSON.stringify(answers) }),
          ...(scores && { scores: JSON.stringify(scores) }),
          ...(currentStep !== undefined && { currentStep }),
          ...(questionnaireProgress !== undefined && { questionnaireProgress }),
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          ...updatedSession,
          answers: safeJsonParse(updatedSession.answers),
          scores: safeJsonParse(updatedSession.scores),
        },
      });
    }

    // Create a new session
    const session = await db.session.create({
      data: {
        userProfileId,
        status: status || 'in_progress',
        answers: JSON.stringify(answers || {}),
        scores: JSON.stringify(scores || {}),
        currentStep: currentStep || 0,
        questionnaireProgress: questionnaireProgress || 0,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...session,
          answers: safeJsonParse(session.answers),
          scores: safeJsonParse(session.scores),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating/updating session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create/update session', ...(process.env.NODE_ENV !== 'production' ? { details: String(error) } : {}) },
      { status: 500 }
    );
  }
}
