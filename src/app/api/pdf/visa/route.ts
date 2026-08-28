import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import { db } from '@/lib/db';

const PKR_RATE = 278.5;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string' || code.length > 20) {
      return NextResponse.json(
        { success: false, error: 'Valid country code is required' },
        { status: 400 }
      );
    }

    const country = await db.country.findUnique({
      where: { code },
      include: {
        visaTypes: true,
        requirements: { orderBy: { category: 'asc' } },
        costProfiles: true,
      },
    });

    if (!country) {
      return NextResponse.json(
        { success: false, error: `Country '${code}' not found` },
        { status: 404 }
      );
    }

    const cost = country.costProfiles[0] || null;
    const reqs = country.requirements;
    const visaTypes = country.visaTypes;

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentW = pageW - margin * 2;
    let y = 20;

    // Helper: add text, auto-paging when needed
    const addText = (text: string, x: number, fontSize: number, style: 'normal' | 'bold' = 'normal', color: [number, number, number] = [30, 30, 30]) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', style);
      doc.setTextColor(color[0], color[1], color[2]);
      const lines = doc.splitTextToSize(text, contentW - (x - margin));
      for (const line of lines) {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, x, y);
        y += fontSize * 0.45;
      }
    };

    const addLine = () => {
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageW - margin, y);
      y += 4;
    };

    const addSectionHeader = (title: string) => {
      if (y > 260) { doc.addPage(); y = 20; }
      y += 4;
      addText(title, margin, 13, 'bold', [34, 139, 34]); // emerald green
      y += 1;
      addLine();
    };

    // ---- HEADER ----
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 0, pageW, 45, 'F');

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('PakVisa Advisor', margin, 16);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Visa Requirements Guide for Pakistani Citizens', margin, 23);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(`${country.flagEmoji}  ${country.name}`, margin, 36);

    // Generated date on the right
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(140, 140, 140);
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Generated: ${dateStr}`, pageW - margin, 16, { align: 'right' });

    y = 52;

    // ---- VISA STATUS ----
    addSectionHeader('Visa Status');
    const status = country.visaFree ? 'Visa Free' : country.visaOnArrival ? 'Visa on Arrival' : country.etaAvailable ? 'e-Visa' : 'Embassy Required';
    const statusColor = country.visaFree ? [34, 139, 34] : country.visaOnArrival ? [200, 120, 0] : country.etaAvailable ? [200, 120, 0] : [200, 30, 30];
    addText(`Status: ${status}`, margin, 11, 'bold', statusColor);
    addText(`Processing Time: ${country.processingDaysMin}–${country.processingDaysMax} business days`, margin, 10);
    if (country.safetyRating > 0) addText(`Safety Rating: ${country.safetyRating}/5`, margin, 10);
    if (country.bestTravelMonths) addText(`Best Travel Months: ${country.bestTravelMonths}`, margin, 10);
    if (country.avgTempC) addText(`Average Temperature: ${country.avgTempC}°C`, margin, 10);
    if (country.timezone) addText(`Timezone: ${country.timezone}`, margin, 10);

    // ---- VISA TYPES ----
    if (visaTypes.length > 0) {
      addSectionHeader('Available Visa Types');
      for (const vt of visaTypes) {
        addText(`• ${vt.type}${vt.maxDuration ? ' — ' + vt.maxDuration : ''}`, margin + 2, 10);
        if (vt.description) addText(`  ${vt.description}`, margin + 6, 9, 'normal', [100, 100, 100]);
        y += 1;
      }
    }

    // ---- DOCUMENT REQUIREMENTS ----
    if (reqs.length > 0) {
      addSectionHeader(`Document Requirements (${reqs.filter(r => r.mandatory).length} required, ${reqs.filter(r => !r.mandatory).length} optional)`);

      // Group by category
      const grouped = new Map<string, typeof reqs>();
      for (const r of reqs) {
        const cat = r.category || 'Other';
        if (!grouped.has(cat)) grouped.set(cat, []);
        grouped.get(cat)!.push(r);
      }

      for (const [category, items] of grouped) {
        if (y > 255) { doc.addPage(); y = 20; }
        addText(category, margin + 2, 11, 'bold', [60, 60, 60]);
        y += 1;
        for (const item of items) {
          const prefix = item.mandatory ? '[Required]' : '[Optional]';
          const itemColor = item.mandatory ? [30, 30, 30] : [120, 120, 120];
          addText(`${prefix} ${item.requirement}`, margin + 6, 9.5, 'normal', itemColor);
          if (item.description) {
            addText(item.description, margin + 10, 8.5, 'normal', [140, 140, 140]);
          }
        }
        y += 2;
      }
    }

    // ---- COST BREAKDOWN ----
    if (cost) {
      addSectionHeader('Cost Breakdown');

      const costItems = [
        ['Visa Fee', `$${cost.visaFeeUSD}`, `≈ PKR ${Math.round(cost.visaFeeUSD * PKR_RATE).toLocaleString()}`],
        ['Service Fee', `$${cost.serviceFeeUSD}`, `≈ PKR ${Math.round(cost.serviceFeeUSD * PKR_RATE).toLocaleString()}`],
        ['Monthly Living Cost', `$${cost.monthlyLivingUSD}`, `≈ PKR ${Math.round(cost.monthlyLivingUSD * PKR_RATE).toLocaleString()}/mo`],
        ['Monthly Rent', `$${cost.monthlyRentUSD}`, `≈ PKR ${Math.round(cost.monthlyRentUSD * PKR_RATE).toLocaleString()}/mo`],
        ['Monthly Food', `$${cost.monthlyFoodUSD}`, `≈ PKR ${Math.round(cost.monthlyFoodUSD * PKR_RATE).toLocaleString()}/mo`],
        ['Monthly Transport', `$${cost.monthlyTransportUSD}`, `≈ PKR ${Math.round(cost.monthlyTransportUSD * PKR_RATE).toLocaleString()}/mo`],
        ['Health Insurance', `$${cost.healthInsuranceUSD}/mo`, `≈ PKR ${Math.round(cost.healthInsuranceUSD * PKR_RATE).toLocaleString()}/mo`],
      ];

      // Simple table
      const colW = [contentW * 0.35, contentW * 0.30, contentW * 0.35];
      const colX = [margin, margin + colW[0], margin + colW[0] + colW[1]];

      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y - 3, contentW, 7, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text('Item', colX[0] + 2, y + 1);
      doc.text('USD', colX[1] + 2, y + 1);
      doc.text('PKR', colX[2] + 2, y + 1);
      y += 7;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      for (const [label, usd, pkr] of costItems) {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.text(label, colX[0] + 2, y);
        doc.text(usd, colX[1] + 2, y);
        doc.text(pkr, colX[2] + 2, y);
        y += 6;
      }

      // Total
      y += 2;
      const totalUSD = cost.visaFeeUSD + cost.serviceFeeUSD;
      addText(`One-time Total: $${totalUSD} (≈ PKR ${Math.round(totalUSD * PKR_RATE).toLocaleString()})`, margin, 10, 'bold', [34, 139, 34]);
      addText(`Monthly Total: $${cost.totalMonthlyUSD} (≈ PKR ${Math.round(cost.totalMonthlyUSD * PKR_RATE).toLocaleString()})`, margin, 10, 'bold', [34, 139, 34]);
    }

    // ---- EMBASSY INFO (for embassy-required countries) ----
    if (!country.visaFree && !country.visaOnArrival && !country.etaAvailable) {
      // Dynamic import embassy data — we inline it here to avoid 'use client' import
      const { EMBASSY_DATA, GENERIC_EMBASSY } = await import('@/components/app/constants');
      const embassy = EMBASSY_DATA[country.code] || GENERIC_EMBASSY;

      addSectionHeader('Embassy in Islamabad');
      addText(`Address: ${embassy.address}`, margin + 2, 10);
      addText(`Phone: ${embassy.phone}`, margin + 2, 10);
      addText(`Email: ${embassy.email}`, margin + 2, 10);
      addText(`Hours: ${embassy.hours}`, margin + 2, 10);
      addText(`Website: ${embassy.website}`, margin + 2, 10);
      if (embassy.note) {
        addText(`Note: ${embassy.note}`, margin + 2, 9, 'normal', [180, 100, 0]);
      }
    }

    // ---- FOOTER ----
    y += 6;
    if (y > 270) { doc.addPage(); y = 20; }
    addLine();
    addText('Disclaimer: This guide is for informational purposes only. Visa requirements, fees, and processing times may change. Always verify with the official embassy or government website before applying.', margin, 8, 'normal', [140, 140, 140]);
    addText('Generated by PakVisa Advisor — pakvisa.com', margin, 8, 'normal', [160, 160, 160]);

    const pdfBytes = doc.output();
    const filename = `pakvisa-${country.name.replace(/\s+/g, '-').toLowerCase()}-guide.pdf`;

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
