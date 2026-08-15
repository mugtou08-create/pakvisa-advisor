import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Country code is required' },
        { status: 400 }
      );
    }

    const country = await db.country.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        visaTypes: true,
        requirements: true,
        costProfiles: true,
      },
    });

    if (!country) {
      return NextResponse.json(
        { success: false, error: `Country with code '${code}' not found` },
        { status: 404 }
      );
    }

    // Parse monthlyTemps from JSON string to object
    let monthlyTemps: any;
    try {
      monthlyTemps = JSON.parse(country.monthlyTemps);
    } catch {
      monthlyTemps = country.monthlyTemps;
    }
    const formattedCountry = {
      ...country,
      monthlyTemps,
    };

    return NextResponse.json({
      success: true,
      data: formattedCountry,
    });
  } catch (error) {
    console.error('Error fetching country:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch country', ...(process.env.NODE_ENV !== 'production' ? { details: String(error) } : {}) },
      { status: 500 }
    );
  }
}
