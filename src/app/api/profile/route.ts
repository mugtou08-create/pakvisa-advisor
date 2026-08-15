import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { UserProfileData } from '@/lib/types';

function safeJsonParse(str: string): any {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

// GET: Return all user profiles
export async function GET() {
  try {
    const profiles = await db.userProfile.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        sessions: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    });

    const formattedProfiles = profiles.map((p) => ({
      ...p,
      languages: safeJsonParse(p.languages),
      priorCountries: safeJsonParse(p.priorCountries),
    }));

    return NextResponse.json({
      success: true,
      data: formattedProfiles,
      total: formattedProfiles.length,
    });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user profiles', ...(process.env.NODE_ENV !== 'production' ? { details: String(error) } : {}) },
      { status: 500 }
    );
  }
}

// POST: Create a new user profile
export async function POST(request: NextRequest) {
  try {
    const body: UserProfileData = await request.json();

    // Validate required fields
    if (!body.fullName || !body.fullName.trim()) {
      return NextResponse.json(
        { success: false, error: 'fullName is required' },
        { status: 400 }
      );
    }

    if (!body.age || body.age < 1 || body.age > 120) {
      return NextResponse.json(
        { success: false, error: 'Valid age (1-120) is required' },
        { status: 400 }
      );
    }

    // Create the profile
    const profile = await db.userProfile.create({
      data: {
        fullName: body.fullName.trim(),
        age: body.age,
        gender: body.gender || '',
        nationality: body.nationality || 'Pakistani',
        passportNumber: body.passportNumber || '',
        passportExpiry: body.passportExpiry ? new Date(body.passportExpiry) : new Date(),
        occupation: body.occupation || '',
        monthlyIncomeUSD: body.monthlyIncomeUSD || 0,
        savingsUSD: body.savingsUSD || 0,
        education: body.education || '',
        languages: JSON.stringify(body.languages || []),
        hasCriminalRecord: body.hasCriminalRecord || false,
        hasPriorTravel: body.hasPriorTravel || false,
        priorCountries: JSON.stringify(body.priorCountries || []),
        hasHealthInsurance: body.hasHealthInsurance || false,
        hasSponsor: body.hasSponsor || false,
        sponsorRelation: body.sponsorRelation || '',
        sponsorIncomeUSD: body.sponsorIncomeUSD || 0,
        travelPurpose: body.travelPurpose || '',
        intendedStayDays: body.intendedStayDays || 30,
        hasReturnTicket: body.hasReturnTicket || false,
        hasHotelBooking: body.hasHotelBooking || false,
        budgetUSD: body.budgetUSD || 0,
        maritalStatus: body.maritalStatus || '',
        dependents: body.dependents || 0,
        hasSpecialNeeds: body.hasSpecialNeeds || false,
        additionalNotes: body.additionalNotes || '',
      },
    });

    const formattedProfile = {
      ...profile,
      languages: safeJsonParse(profile.languages),
      priorCountries: safeJsonParse(profile.priorCountries),
    };

    return NextResponse.json(
      { success: true, data: formattedProfile },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user profile', ...(process.env.NODE_ENV !== 'production' ? { details: String(error) } : {}) },
      { status: 500 }
    );
  }
}
