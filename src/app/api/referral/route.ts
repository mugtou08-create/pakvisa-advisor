import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function generateRefCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SARA';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function getClientIp(request: NextRequest): string {
  return (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
}

/**
 * Share-All → Unlock Pro referral system.
 *
 * Simple model for non-tech users:
 *   - Share your link with your entire contact list (WhatsApp groups, friends, family)
 *   - Once 3 new people visit from your link → Pro unlocked for 7 days!
 *   - That's it. One goal, one big reward.
 *
 * Constants:
 *   VISITORS_NEEDED = 3  (how many unique visits to unlock Pro)
 *   PRO_DAYS_GRANTED = 7 (how many Pro days you get)
 */
const VISITORS_NEEDED = 3;
const PRO_DAYS_GRANTED = 7;

// Generate a referral code for the current user
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const body = await request.json();
    const sid = body.sid || '';

    // Check if this IP already has a referral code
    const existing = await db.referral.findFirst({ where: { referrerIp: ip } });
    if (existing) {
      return NextResponse.json({
        success: true,
        data: {
          refCode: existing.refCode,
          visitorCount: existing.visitorCount,
          rewardTier: existing.rewardTier,
          bonusQueries: existing.bonusQueries,
          proDaysEarned: existing.proDaysEarned,
          proUnlocked: existing.rewardTier >= 1,
          visitorsNeeded: VISITORS_NEEDED,
          isNew: false,
        },
      });
    }

    // Generate unique code
    let refCode = generateRefCode();
    let attempts = 0;
    while (await db.referral.findUnique({ where: { refCode } }) && attempts < 10) {
      refCode = generateRefCode();
      attempts++;
    }

    const referral = await db.referral.create({
      data: { refCode, referrerIp: ip, referrerSid: sid },
    });

    return NextResponse.json({
      success: true,
      data: {
        refCode: referral.refCode,
        visitorCount: 0,
        rewardTier: 0,
        bonusQueries: 0,
        proDaysEarned: 0,
        proUnlocked: false,
        visitorsNeeded: VISITORS_NEEDED,
        isNew: true,
      },
    });
  } catch (error) {
    console.error('Referral create error:', error);
    // Return graceful fallback instead of 500 — prevents console errors
    return NextResponse.json({
      success: true,
      data: { hasReferral: false },
    });
  }
}

// Track a visit from a referral link
export async function PUT(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const body = await request.json();
    const { refCode } = body;

    if (!refCode || typeof refCode !== 'string') {
      return NextResponse.json({ success: false, error: 'refCode is required' }, { status: 400 });
    }

    const referral = await db.referral.findUnique({ where: { refCode } });
    if (!referral) {
      return NextResponse.json({ success: false, error: 'Invalid referral code' }, { status: 404 });
    }

    // Don't count the referrer's own IP
    if (referral.referrerIp === ip) {
      return NextResponse.json({
        success: true,
        data: { counted: false, reason: 'own_ip' },
      });
    }

    // Check if this IP already visited this referral
    const alreadyVisited = await db.referralVisitor.findFirst({
      where: { referralId: referral.id, visitorIp: ip },
    });
    if (alreadyVisited) {
      return NextResponse.json({
        success: true,
        data: { counted: false, reason: 'already_visited' },
      });
    }

    // Record the visit
    await db.referralVisitor.create({
      data: { referralId: referral.id, visitorIp: ip },
    });

    // Update referral counts
    const newVisitorCount = referral.visitorCount + 1;
    let newRewardTier = referral.rewardTier;
    let newBonusQueries = referral.bonusQueries;
    let newProDaysEarned = referral.proDaysEarned;
    let proJustUnlocked = false;

    // ============================================================
    // NEW MODEL: Share All → Unlock Pro
    // 3 unique visitors = Pro unlocked for 7 days
    // ============================================================
    if (newVisitorCount >= VISITORS_NEEDED && referral.rewardTier < 1) {
      newRewardTier = 1;        // 1 = Pro unlocked via referral
      newProDaysEarned = PRO_DAYS_GRANTED;
      newBonusQueries = 999;    // Effectively unlimited during Pro period
      proJustUnlocked = true;
    }

    await db.referral.update({
      where: { id: referral.id },
      data: {
        visitorCount: newVisitorCount,
        rewardTier: newRewardTier,
        bonusQueries: newBonusQueries,
        proDaysEarned: newProDaysEarned,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        counted: true,
        visitorCount: newVisitorCount,
        rewardTier: newRewardTier,
        bonusQueries: newBonusQueries,
        proDaysEarned: newProDaysEarned,
        proUnlocked: newRewardTier >= 1,
        proJustUnlocked,
        visitorsNeeded: VISITORS_NEEDED,
      },
    });
  } catch (error) {
    console.error('Referral track error:', error);
    return NextResponse.json({ success: false, error: 'Failed to track referral' }, { status: 500 });
  }
}

// Check referral status (GET)
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { searchParams } = new URL(request.url);
    const refCode = searchParams.get('code');

    if (!refCode) {
      // Return status for this IP's own referral
      const referral = await db.referral.findFirst({ where: { referrerIp: ip } });
      if (!referral) {
        return NextResponse.json({
          success: true,
          data: { hasReferral: false, visitorsNeeded: VISITORS_NEEDED },
        });
      }
      return NextResponse.json({
        success: true,
        data: {
          hasReferral: true,
          refCode: referral.refCode,
          visitorCount: referral.visitorCount,
          rewardTier: referral.rewardTier,
          bonusQueries: referral.bonusQueries,
          proDaysEarned: referral.proDaysEarned,
          proUnlocked: referral.rewardTier >= 1,
          visitorsNeeded: VISITORS_NEEDED,
        },
      });
    }

    // Return status for a specific referral code
    const referral = await db.referral.findUnique({ where: { refCode } });
    if (!referral) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        refCode: referral.refCode,
        visitorCount: referral.visitorCount,
        rewardTier: referral.rewardTier,
        bonusQueries: referral.bonusQueries,
        proDaysEarned: referral.proDaysEarned,
        proUnlocked: referral.rewardTier >= 1,
        visitorsNeeded: VISITORS_NEEDED,
      },
    });
  } catch (error) {
    // DB may be unreachable — return graceful fallback instead of 500
    console.error('Referral status error:', error);
    return NextResponse.json({
      success: true,
      data: { hasReferral: false, visitorsNeeded: VISITORS_NEEDED },
    });
  }
}
