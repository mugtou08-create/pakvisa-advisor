#!/usr/bin/env python3
"""
PakVisa Advisor - Growth Strategy & Revenue Analysis Report
Professional PDF generation using ReportLab
"""

import hashlib
import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, KeepTogether, HRFlowable, ListFlowable, ListItem
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.platypus.tableofcontents import TableOfContents

# ━━ Font Registration ━━
FONT_DIR = '/usr/share/fonts'
pdfmetrics.registerFont(TTFont('Tinos', f'{FONT_DIR}/truetype/liberation/LiberationSerif-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Tinos-Bold', f'{FONT_DIR}/truetype/liberation/LiberationSerif-Bold.ttf'))
pdfmetrics.registerFont(TTFont('Tinos-Italic', f'{FONT_DIR}/truetype/liberation/LiberationSerif-Italic.ttf'))
pdfmetrics.registerFont(TTFont('Tinos-BoldItalic', f'{FONT_DIR}/truetype/liberation/LiberationSerif-BoldItalic.ttf'))
registerFontFamily('Tinos', normal='Tinos', bold='Tinos-Bold', italic='Tinos-Italic', boldItalic='Tinos-BoldItalic')

pdfmetrics.registerFont(TTFont('Carlito', f'{FONT_DIR}/truetype/liberation/LiberationSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Carlito-Bold', f'{FONT_DIR}/truetype/liberation/LiberationSans-Bold.ttf'))

# ━━ Cascade Palette (auto-generated) ━━
PAGE_BG       = colors.HexColor('#f1f0ef')
SECTION_BG    = colors.HexColor('#f2f2f1')
CARD_BG       = colors.HexColor('#eeedea')
TABLE_STRIPE  = colors.HexColor('#f1f0ed')
HEADER_FILL   = colors.HexColor('#665c3e')
COVER_BLOCK   = colors.HexColor('#615a43')
BORDER        = colors.HexColor('#d1cbbb')
ICON          = colors.HexColor('#928250')
ACCENT        = colors.HexColor('#917520')
ACCENT_2      = colors.HexColor('#56acc8')
TEXT_PRIMARY   = colors.HexColor('#1d1c1a')
TEXT_MUTED     = colors.HexColor('#8f8c86')
SEM_SUCCESS   = colors.HexColor('#477857')
SEM_WARNING   = colors.HexColor('#91753d')
SEM_ERROR     = colors.HexColor('#965650')
SEM_INFO      = colors.HexColor('#597a9a')

# ━━ Page Setup ━━
PAGE_W, PAGE_H = A4
LEFT_M = 55
RIGHT_M = 55
TOP_M = 60
BOTTOM_M = 60
CONTENT_W = PAGE_W - LEFT_M - RIGHT_M

OUTPUT_PATH = '/home/z/my-project/PakVisa_Growth_Strategy_Report.pdf'

# ━━ Styles ━━
styles = getSampleStyleSheet()

s_title = ParagraphStyle('CustomTitle', fontName='Carlito-Bold', fontSize=28, leading=34, textColor=TEXT_PRIMARY, alignment=TA_LEFT, spaceAfter=12, spaceBefore=0)
s_h1 = ParagraphStyle('H1', fontName='Carlito-Bold', fontSize=20, leading=26, textColor=HEADER_FILL, spaceAfter=10, spaceBefore=24, borderColor=ACCENT, borderWidth=0, borderPadding=0)
s_h2 = ParagraphStyle('H2', fontName='Carlito-Bold', fontSize=15, leading=20, textColor=ACCENT, spaceAfter=8, spaceBefore=18)
s_h3 = ParagraphStyle('H3', fontName='Carlito-Bold', fontSize=12, leading=16, textColor=TEXT_PRIMARY, spaceAfter=6, spaceBefore=12)
s_body = ParagraphStyle('Body', fontName='Tinos', fontSize=10.5, leading=16, textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceAfter=8)
s_body_indent = ParagraphStyle('BodyIndent', fontName='Tinos', fontSize=10.5, leading=16, textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceAfter=8, leftIndent=18)
s_bullet = ParagraphStyle('Bullet', fontName='Tinos', fontSize=10.5, leading=16, textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceAfter=4, leftIndent=28, bulletIndent=14, bulletFontName='Tinos', bulletFontSize=10.5)
s_callout = ParagraphStyle('Callout', fontName='Carlito-Bold', fontSize=11, leading=16, textColor=ACCENT, alignment=TA_LEFT, spaceAfter=8, spaceBefore=8, leftIndent=12, borderColor=ACCENT, borderWidth=2, borderPadding=(8,8,8,8))
s_caption = ParagraphStyle('Caption', fontName='Tinos-Italic', fontSize=9, leading=13, textColor=TEXT_MUTED, alignment=TA_LEFT, spaceAfter=4)
s_footer = ParagraphStyle('Footer', fontName='Tinos', fontSize=8, leading=10, textColor=TEXT_MUTED, alignment=TA_CENTER)
s_toc_h0 = ParagraphStyle('TOCH0', fontName='Carlito-Bold', fontSize=12, leading=18, textColor=HEADER_FILL, leftIndent=0, spaceBefore=6, spaceAfter=3)
s_toc_h1 = ParagraphStyle('TOCH1', fontName='Carlito', fontSize=10.5, leading=16, textColor=TEXT_PRIMARY, leftIndent=20, spaceBefore=3, spaceAfter=2)
s_table_header = ParagraphStyle('TableHeader', fontName='Carlito-Bold', fontSize=9.5, leading=13, textColor=colors.white, alignment=TA_CENTER)
s_table_cell = ParagraphStyle('TableCell', fontName='Tinos', fontSize=9, leading=13, textColor=TEXT_PRIMARY, alignment=TA_LEFT)
s_table_cell_center = ParagraphStyle('TableCellCenter', fontName='Tinos', fontSize=9, leading=13, textColor=TEXT_PRIMARY, alignment=TA_CENTER)

# ━━ Helper Functions ━━
def heading(text, style):
    return Paragraph(text, style)

def body(text):
    return Paragraph(text, s_body)

def bullet_list(items):
    """Create a formatted bullet list."""
    elements = []
    for item in items:
        elements.append(Paragraph(f'<bullet>&bull;</bullet> {item}', s_bullet))
    return elements

def callout(text):
    return Paragraph(text, s_callout)

def section_divider():
    return HRFlowable(width="100%", thickness=1, color=BORDER, spaceBefore=6, spaceAfter=6)

def make_table(headers, rows, col_widths=None):
    """Create a styled table with cascade palette colors."""
    header_row = [Paragraph(h, s_table_header) for h in headers]
    data_rows = []
    for row in rows:
        data_rows.append([Paragraph(str(c), s_table_cell) if i == 0 else Paragraph(str(c), s_table_cell_center) for i, c in enumerate(row)])
    all_data = [header_row] + data_rows
    
    if col_widths is None:
        col_widths = [CONTENT_W * r for r in [0.35, 0.20, 0.20, 0.25]]
    
    t = Table(all_data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0,0), (-1,0), HEADER_FILL),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Carlito-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9.5),
        ('BOTTOMPADDING', (0,0), (-1,0), 8),
        ('TOPPADDING', (0,0), (-1,0), 8),
        ('ALIGN', (1,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, TABLE_STRIPE]),
    ]
    t.setStyle(TableStyle(style_cmds))
    return t

def pros_cons_table(pros, cons):
    """Create a Pros vs Cons comparison table."""
    max_rows = max(len(pros), len(cons))
    data = [
        [Paragraph('<b>Advantages (Pros)</b>', ParagraphStyle('PH', fontName='Carlito-Bold', fontSize=10, textColor=SEM_SUCCESS)),
         Paragraph('<b>Disadvantages (Cons)</b>', ParagraphStyle('CH', fontName='Carlito-Bold', fontSize=10, textColor=SEM_ERROR))]
    ]
    for i in range(max_rows):
        p_text = pros[i] if i < len(pros) else ''
        c_text = cons[i] if i < len(cons) else ''
        data.append([
            Paragraph(p_text, ParagraphStyle('PC', fontName='Tinos', fontSize=9, leading=13, textColor=TEXT_PRIMARY)),
            Paragraph(c_text, ParagraphStyle('CC', fontName='Tinos', fontSize=9, leading=13, textColor=TEXT_PRIMARY))
        ])
    t = Table(data, colWidths=[CONTENT_W * 0.48, CONTENT_W * 0.48], spaceBefore=6, spaceAfter=6)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), SEM_SUCCESS),
        ('BACKGROUND', (1,0), (1,0), SEM_ERROR),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, TABLE_STRIPE]),
    ]))
    return t

# ━━ TOC Document Template ━━
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

def add_heading(text, style, level=0):
    key = f'h_{hashlib.md5(text.encode()).hexdigest()[:8]}'
    p = Paragraph(f'<a name="{key}"/>{text}', style)
    p.bookmark_name = key
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

# ━━ Build Document ━━
story = []

# -- COVER (rendered separately via HTML, but we put a simple text-based cover here) --
# Since we need a single-file approach, we'll build a simple but elegant cover in ReportLab
story.append(Spacer(1, 120))
story.append(Paragraph('GROWTH STRATEGY &<br/>REVENUE ANALYSIS REPORT', ParagraphStyle('CoverTitle', fontName='Carlito-Bold', fontSize=32, leading=38, textColor=HEADER_FILL, alignment=TA_LEFT, spaceAfter=16)))
story.append(HRFlowable(width="40%", thickness=3, color=ACCENT, spaceBefore=4, spaceAfter=16, hAlign='LEFT'))
story.append(Paragraph('PakVisa Advisor', ParagraphStyle('CoverSub', fontName='Carlito', fontSize=20, leading=26, textColor=TEXT_PRIMARY, alignment=TA_LEFT, spaceAfter=12)))
story.append(Paragraph('Free AI-Powered Visa Checker for Pakistani Passport Holders', ParagraphStyle('CoverDesc', fontName='Tinos', fontSize=12, leading=18, textColor=TEXT_MUTED, alignment=TA_LEFT, spaceAfter=8, maxWidth=380)))
story.append(Spacer(1, 40))
story.append(Paragraph('Comprehensive Business Analysis: Traffic Growth Strategies,<br/>Revenue Projections, Competitive Landscape & Feature Roadmap', ParagraphStyle('CoverBody', fontName='Tinos', fontSize=11, leading=17, textColor=TEXT_PRIMARY, alignment=TA_LEFT, maxWidth=420)))
story.append(Spacer(1, 80))
story.append(HRFlowable(width="100%", thickness=1, color=BORDER, spaceBefore=8, spaceAfter=8))
story.append(Paragraph('Prepared for PakVisa Advisor Ownership  |  June 2025  |  Confidential', ParagraphStyle('CoverFooter', fontName='Tinos', fontSize=9, leading=13, textColor=TEXT_MUTED, alignment=TA_LEFT)))
story.append(PageBreak())

# -- TABLE OF CONTENTS --
story.append(Paragraph('Table of Contents', s_title))
story.append(HRFlowable(width="100%", thickness=1.5, color=HEADER_FILL, spaceBefore=4, spaceAfter=12))
toc = TableOfContents()
toc.levelStyles = [s_toc_h0, s_toc_h1]
story.append(toc)
story.append(PageBreak())

# ════════════════════════════════════════════════════════════════
# CHAPTER 1: EXECUTIVE SUMMARY
# ════════════════════════════════════════════════════════════════
story.append(add_heading('1. Executive Summary', s_h1, 0))
story.append(section_divider())

story.append(body(
    'PakVisa Advisor is a free, AI-powered visa information web application designed specifically for Pakistani passport holders. '
    'It currently covers 70 countries with 443 visa types, providing instant visa requirement checks, AI-powered travel consultation, '
    'visa quizzes, country comparison tools, community experiences, and cost breakdowns in Pakistani Rupees (PKR). '
    'This report provides a comprehensive analysis of the webapp\'s current position, competitive landscape, growth strategies, '
    'revenue potential, and a detailed feature roadmap to maximize both organic traffic and passive income.'
))

story.append(body(
    'The online visa services market was valued at $1.8 billion in 2025 and is projected to reach $4.6 billion by 2034, '
    'growing at 11% annually. Pakistanis spent approximately $2.4 billion on travel abroad in 2024. With a population of over '
    '240 million people, a growing middle class, and increasing digital adoption, PakVisa Advisor is positioned in a massive '
    'and underserved niche market with enormous growth potential.'
))

story.append(callout('Key Finding: No major competitor offers a free, AI-powered, Pakistan-specific visa tool with local currency pricing, community stories, and WhatsApp sharing. PakVisa has a clear first-mover advantage in this exact niche.'))

story.append(body(
    'This report conservatively estimates that PakVisa Advisor can generate $500 to $3,000 per month in passive income '
    'within the first 6-12 months through a combination of display advertising, affiliate partnerships, and a freemium model. '
    'By month 18-24, with proper SEO and feature execution, monthly revenue could reach $5,000 to $15,000 or more.'
))

story.append(PageBreak())

# ════════════════════════════════════════════════════════════════
# CHAPTER 2: WHAT PAKVISA OFFERS (UNIQUE VALUE PROPOSITION)
# ════════════════════════════════════════════════════════════════
story.append(add_heading('2. What PakVisa Advisor Offers That Others Do Not', s_h1, 0))
story.append(section_divider())

story.append(add_heading('2.1 Current Feature Set', s_h2, 1))

story.append(body(
    'PakVisa Advisor is not just another visa checker. It is a comprehensive travel intelligence platform built from the ground up '
    'for Pakistani travelers. Every feature is designed with the specific needs, behaviors, and preferences of Pakistani passport '
    'holders in mind. Below is a detailed breakdown of what makes PakVisa different from anything else on the market today.'
))

features = [
    '<b>Instant Visa Checker (70+ Countries, 443 Visa Types):</b> Users can search any country and instantly see visa requirements, processing times, costs in both USD and PKR, safety ratings, and best travel months. This is far more detailed than any competitor.',
    '<b>AI Visa Consultant:</b> A built-in AI chatbot that answers personalized visa questions in plain English or Urdu. No other free visa tool offers this level of personalized assistance.',
    '<b>Visa Recommendation Quiz:</b> An interactive quiz that asks users about their travel preferences (budget, purpose, duration) and recommends the best countries to visit based on their Pakistani passport.',
    '<b>Country Comparison Tool:</b> Users can compare 2-3 countries side-by-side across visa type, cost, processing time, safety, and climate metrics.',
    '<b>Community Experiences:</b> Real stories from Pakistani travelers who share their actual visa application experiences, including difficulty level, tips, and timeline. This builds trust and engagement.',
    '<b>Cost Breakdown in PKR:</b> Every country shows visa fees, service fees, and estimated monthly living costs in both USD and Pakistani Rupees. No competitor does this for Pakistani users.',
    '<b>Best Time to Visit Calendar:</b> A visual monthly calendar showing optimal travel seasons for each country based on temperature data and weather patterns.',
    '<b>Passport Power Ranking:</b> Pakistan\'s position in the global Henley Passport Index, with comparison to neighboring countries (India, Bangladesh, Afghanistan, Sri Lanka).',
    '<b>WhatsApp Sharing:</b> One-tap WhatsApp sharing of country visa details, designed for the Pakistani market where WhatsApp is the dominant messaging platform.',
    '<b>Smart Filters & Pagination:</b> Advanced filtering by visa type (visa-free, VoA, e-Visa, embassy), region, attributes (cheapest, fastest, safest, hottest, coldest), with clean 15-per-page pagination.'
]
story.extend(bullet_list(features))
story.append(Spacer(1, 8))

story.append(add_heading('2.2 Unique Competitive Advantages', s_h2, 1))

story.append(body(
    'What truly sets PakVisa apart is the combination of features that no single competitor offers together. '
    'While PassportIndex.org provides passport rankings and VisaGuide.world shows visa requirements, neither offers AI consultation, '
    'community stories, PKR pricing, or WhatsApp sharing. The table below summarizes the key differentiators.'
))

comp_table = make_table(
    ['Feature', 'PakVisa', 'PassportIndex', 'VisaGuide', 'iVisa'],
    [
        ['Free Visa Check', 'Yes', 'Yes', 'Yes', 'Partial'],
        ['AI Consultant', 'Yes', 'No', 'No', 'No'],
        ['Visa Quiz', 'Yes', 'No', 'No', 'No'],
        ['Country Compare', 'Yes', 'No', 'No', 'No'],
        ['Community Stories', 'Yes', 'No', 'No', 'No'],
        ['PKR Cost Display', 'Yes', 'No', 'No', 'No'],
        ['WhatsApp Sharing', 'Yes', 'No', 'No', 'No'],
        ['Best Travel Time', 'Yes', 'No', 'No', 'No'],
        ['Passport Ranking', 'Yes', 'Yes', 'No', 'No'],
        ['Visa Processing', 'No', 'No', 'No', 'Yes'],
        ['Price', 'Free', 'Free', 'Free', '$30-$200+'],
    ],
    col_widths=[CONTENT_W*0.26, CONTENT_W*0.18, CONTENT_W*0.18, CONTENT_W*0.18, CONTENT_W*0.18]
)
story.append(comp_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Table 1: Feature comparison of PakVisa Advisor vs. major competitors', s_caption))

story.append(callout('PakVisa is the ONLY platform that combines free visa checking with AI consultation, community experiences, local currency pricing, and social sharing specifically for Pakistani passport holders.'))

story.append(PageBreak())

# ════════════════════════════════════════════════════════════════
# CHAPTER 3: COMPETITIVE LANDSCAPE
# ════════════════════════════════════════════════════════════════
story.append(add_heading('3. Competitive Landscape Analysis', s_h1, 0))
story.append(section_divider())

story.append(body(
    'Understanding the competitive landscape is critical for positioning PakVisa Advisor for success. '
    'The visa information and services market has several types of players, each with different business models, strengths, and weaknesses. '
    'This chapter provides a detailed analysis of each major competitor, what made them successful, and where PakVisa can win.'
))

story.append(add_heading('3.1 PassportIndex.org', s_h2, 1))
story.append(body(
    '<b>Overview:</b> PassportIndex is the world\'s leading interactive passport ranking tool. It receives approximately 2.3 million visits '
    'per month with an average session duration of about 4.5 minutes. It ranks all world passports by visa-free score, color, and country. '
    '<b>What made them successful:</b> They were the first to create a visually engaging, interactive passport ranking tool. Their real-time '
    'ranking data and beautiful UI made them go viral on social media. People love sharing their passport rank, creating organic viral loops. '
    '<b>Their weakness:</b> They are a general tool for ALL passports. They do not offer Pakistan-specific features, no AI consultation, '
    'no community stories, no local currency, and no WhatsApp integration. Their information is broad but shallow.'
))

story.append(add_heading('3.2 VisaGuide.world', s_h2, 1))
story.append(body(
    '<b>Overview:</b> VisaGuide.world provides visa requirements by passport, covering 178+ countries for Pakistani citizens. '
    'It is a direct information competitor with basic visa requirement listings, document checklists, and embassy contact details. '
    '<b>What made them successful:</b> They captured long-tail SEO traffic by creating individual pages for every passport-country '
    'visa combination. When someone Googles "Pakistan passport visa for Turkey", VisaGuide often appears in search results. '
    '<b>Their weakness:</b> The site has a basic, outdated design. No interactive tools, no AI features, no community content, '
    'no cost breakdowns in PKR, and no social sharing features. It is essentially a static information directory.'
))

story.append(add_heading('3.3 iVisa.com', s_h2, 1))
story.append(body(
    '<b>Overview:</b> iVisa is a US-based online visa processing company with 201-500 employees. Founded in 2012, it helps travelers '
    'apply for visas and travel authorizations online. They charge $30 to $200+ for their processing services. '
    '<b>What made them successful:</b> They solved a real pain point: the confusing and time-consuming visa application process. '
    'By offering a streamlined application with document checking and embassy liaison, they attracted millions of users willing to pay '
    'for convenience. <b>Their weakness:</b> They are a paid service, not a free information tool. They do not provide comprehensive '
    'visa requirement information for free. They also do not cater specifically to Pakistani travelers, offer no community features, '
    'and their pricing in USD can be expensive for Pakistani users.'
))

story.append(add_heading('3.4 VisaHQ.com', s_h2, 1))
story.append(body(
    '<b>Overview:</b> VisaHQ is a global visa processing platform that serves both individual travelers and businesses. '
    'They offer online visa applications for countries worldwide and have a B2B platform for corporate travel management. '
    '<b>What made them successful:</b> They built a comprehensive database of visa requirements combined with paid processing services. '
    'Their B2B focus creates stable, recurring revenue from corporate clients. '
    '<b>Their weakness:</b> They focus on processing, not information. Their free content is limited and designed to drive users toward '
    'paid services. No AI tools, no community features, no Pakistan-specific content.'
))

story.append(add_heading('3.5 Henley & Partners', s_h2, 1))
story.append(body(
    '<b>Overview:</b> Henley & Partners is the original creator of the Henley Passport Index, the most authoritative passport ranking '
    'in the world. They are a premium citizenship and residency advisory firm. <b>What made them successful:</b> Authoritative data, '
    'prestige, and targeting ultra-high-net-worth individuals for citizenship-by-investment programs worth hundreds of thousands of dollars. '
    '<b>Their weakness:</b> They target the ultra-wealthy. Their passport index is a marketing tool for their core business, not a consumer product. '
    'No free tools, no AI features, completely irrelevant for the average Pakistani traveler.'
))

story.append(add_heading('3.6 Competitive Positioning Summary', s_h2, 1))

pos_table = make_table(
    ['Competitor', 'Monthly Traffic', 'Business Model', 'Pakistan Focus', 'AI Features'],
    [
        ['PakVisa Advisor', 'Starting', 'Free + Freemium', '100% focused', 'Full suite'],
        ['PassportIndex', '~2.3M', 'Ad-supported', 'No', 'None'],
        ['VisaGuide.world', '~500K', 'Ad + Affiliate', 'Partial', 'None'],
        ['iVisa', '~5M', 'Paid processing', 'No', 'None'],
        ['VisaHQ', '~1M', 'Paid processing', 'No', 'None'],
        ['Henley & Partners', '~800K', 'Premium advisory', 'No', 'None'],
    ],
    col_widths=[CONTENT_W*0.22, CONTENT_W*0.18, CONTENT_W*0.22, CONTENT_W*0.18, CONTENT_W*0.18]
)
story.append(pos_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Table 2: Competitive positioning summary of major visa information platforms', s_caption))

story.append(callout('PakVisa occupies a unique position: 100% focused on Pakistani travelers with free tools, AI features, and community content. No other platform serves this exact niche.'))

story.append(PageBreak())

# ════════════════════════════════════════════════════════════════
# CHAPTER 4: MARKET OPPORTUNITY
# ════════════════════════════════════════════════════════════════
story.append(add_heading('4. Market Opportunity & Audience Size', s_h1, 0))
story.append(section_divider())

story.append(add_heading('4.1 The Pakistani Traveler Market', s_h2, 1))

story.append(body(
    'Pakistan represents one of the largest untapped digital travel markets in the world. With a population of over 240 million, '
    'a rapidly growing middle class, increasing internet penetration (currently over 55% with 135+ million users), and a young '
    'demographic (64% of the population is under 30), the market potential is enormous. Pakistanis spent approximately $2.4 billion '
    'on travel abroad in 2024, a number that continues to grow year over year. The country earned $1.15 billion from foreign tourists '
    'in the same period, highlighting a significant travel deficit that translates to outbound travel demand.'
))

story.append(body(
    'The Pakistani passport is one of the weakest in the world, ranked around 106th by the Henley Passport Index with only 33 visa-free '
    'destinations. This weakness is actually a powerful business advantage for PakVisa: because Pakistani travelers face visa requirements '
    'for almost every country they want to visit, they NEED visa information more than travelers from most other countries. This creates '
    'high-intent, repeat usage behavior. A UK citizen rarely needs to check visa requirements, but a Pakistani traveler checks visa '
    'requirements for nearly every trip they plan.'
))

story.append(add_heading('4.2 Market Size Estimates', s_h2, 1))

market_table = make_table(
    ['Metric', 'Value', 'Source / Basis'],
    [
        ['Pakistan Population', '240+ million', 'World Bank 2024'],
        ['Internet Users', '135+ million (55%+)', 'PTA / DataReportal'],
        ['Outbound Travel Spend', '$2.4 billion (2024)', 'SBP / Tourism Reports'],
        ['Passport Holders', '~90+ million', 'NADRA estimates'],
        ['Visa-Free Destinations', '33 countries', 'Henley Index 2025'],
        ['Online Visa Services Market', '$1.8B (2025)', 'Market Research Reports'],
        ['Projected Market (2034)', '$4.6 billion', 'CAGR 11%'],
        ['Pakistani Youth (under 30)', '64% of population', 'Census Bureau'],
    ],
    col_widths=[CONTENT_W*0.35, CONTENT_W*0.25, CONTENT_W*0.38]
)
story.append(market_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Table 3: Key market size metrics for the Pakistani travel and visa information market', s_caption))

story.append(add_heading('4.3 Why This Market Is Special', s_h2, 1))

market_reasons = [
    '<b>High Intent, Repeat Usage:</b> Pakistani travelers need visa info for almost every destination. Unlike strong passport holders who rarely check, Pakistani users return again and again, creating natural repeat traffic.',
    '<b>WhatsApp Viral Loop:</b> Pakistan is one of the largest WhatsApp markets in the world. The one-tap share feature creates organic viral distribution that competitors cannot match.',
    '<b>Growing Middle Class:</b> Pakistan\'s middle class is expanding rapidly, with increasing disposable income and travel aspirations. This is a long-term growth tailwind.',
    '<b>Low Digital Competition:</b> Despite the massive market size, there is virtually no Pakistan-specific, AI-powered, free visa tool. PakVisa has a genuine first-mover advantage.',
    '<b>Mobile-First Nation:</b> Over 80% of Pakistan\'s internet traffic is mobile. PakVisa\'s responsive design aligns perfectly with user behavior.',
    '<b>Weak Passport = More Research:</b> Pakistani travelers spend significantly more time researching visa requirements than travelers from stronger passport countries. More research time means more page views, more ad impressions, and more engagement.'
]
story.extend(bullet_list(market_reasons))

story.append(PageBreak())

# ════════════════════════════════════════════════════════════════
# CHAPTER 5: TRAFFIC GROWTH STRATEGIES
# ════════════════════════════════════════════════════════════════
story.append(add_heading('5. Traffic Growth Strategies', s_h1, 0))
story.append(section_divider())

story.append(body(
    'Driving massive organic traffic requires a multi-channel strategy. This chapter outlines the most effective approaches for PakVisa, '
    'discussing the pros and cons of each strategy, and recommending the optimal mix for maximum growth.'
))

story.append(add_heading('5.1 SEO (Search Engine Optimization) - The Foundation', s_h2, 1))

story.append(body(
    'SEO is the single most important traffic driver for a visa information website. Pakistani travelers naturally search Google for phrases '
    'like "Pakistan passport visa for Turkey", "Do Pakistani need visa for UAE", "cheapest countries for Pakistanis", '
    'and "visa-free countries for Pakistani passport". Ranking on the first page of Google for these queries is the most valuable '
    'and sustainable traffic source available. This is exactly what the FAQ section (already implemented) and the country-specific content pages are designed to capture.'
))

story.append(body(
    '<b>What to implement:</b> Create individual SEO-optimized pages for each of the 70 countries (e.g., /visa/turkey, /visa/uae). '
    'Each page should have a unique, detailed article about visa requirements, process, tips, and frequently asked questions. '
    'Add structured data (Schema.org) for FAQ content to get rich snippets in Google search results. Target long-tail keywords like '
    '"how to apply for Turkey visa from Pakistan", "Turkey visa fee for Pakistani citizens 2025", and "Turkey visa processing time Pakistan".'
))

story.append(add_heading('5.2 Social Media & Content Marketing', s_h2, 1))

story.append(body(
    'Pakistan has one of the most active social media user bases in the world. YouTube, Instagram, TikTok, and Facebook are enormously popular. '
    'Creating short-form video content about visa tips, travel hacks, and country-specific visa guides can drive significant referral traffic. '
    'For example, a YouTube video titled "10 Visa-Free Countries for Pakistanis You Didn\'t Know About" or a TikTok series '
    '"Visa Requirements in 60 Seconds" can generate thousands of views and drive traffic to PakVisa.'
))

story.append(add_heading('5.3 WhatsApp Viral Loop', s_h2, 1))

story.append(body(
    'The WhatsApp sharing feature already built into PakVisa is a powerful growth engine. Pakistani WhatsApp groups for travel, '
    'students abroad, and job seekers are extremely active. When one person shares a PakVisa country card in a WhatsApp group, '
    'it reaches dozens of potential new users instantly. This organic, trust-based distribution is more effective than paid advertising '
    'in the Pakistani market. Enhancing this with referral incentives (e.g., "Share with 5 friends to unlock premium features") '
    'could dramatically accelerate growth.'
))

story.append(add_heading('5.4 Additional Growth Channels', s_h2, 1))

growth_channels = [
    '<b>Google Discover:</b> By creating visually appealing, image-rich content about travel destinations for Pakistani passport holders, PakVisa can appear in Google Discover feeds, driving massive passive traffic.',
    '<b>Reddit & Quora:</b> Answering visa-related questions on platforms like r/Pakistan and Quora with links to PakVisa establishes authority and drives high-intent traffic.',
    '<b>Email Newsletter:</b> A weekly "Visa Updates & Travel Deals" email newsletter builds a direct communication channel. Even a small list of 10,000 subscribers becomes valuable over time.',
    '<b>Pakistan-Specific Forums:</b> Engaging on Pakistani forums like PakWheels, CSS Forum, and student communities to provide helpful visa information with links to PakVisa.',
    '<b>Embassy Partnerships:</b> Partnering with embassy social media accounts to share PakVisa as a resource for visa requirements.',
    '<b>University Outreach:</b> Pakistani students are among the most active visa researchers. Partnering with university counseling offices and study-abroad consultants creates a steady stream of high-intent users.'
]
story.extend(bullet_list(growth_channels))

story.append(PageBreak())

# ════════════════════════════════════════════════════════════════
# CHAPTER 6: REVENUE STRATEGIES
# ════════════════════════════════════════════════════════════════
story.append(add_heading('6. Revenue Strategies & Passive Income Streams', s_h1, 0))
story.append(section_divider())

story.append(body(
    'PakVisa Advisor can generate passive income through multiple complementary revenue streams. The key principle is to never charge '
    'for the core visa checking experience (which must remain free to maintain trust and traffic), but to monetize value-added services '
    'and premium features around the free core. This chapter details each revenue stream with realistic income projections.'
))

story.append(add_heading('6.1 Google AdSense / Display Advertising', s_h2, 1))

story.append(body(
    'Display advertising is the most straightforward and reliable passive income stream. Travel niche websites typically earn '
    '$0.50 to $3.00 RPM (revenue per 1,000 page views), with Pakistani traffic earning on the lower end ($0.30 to $1.50 RPM). '
    'However, the high-intent nature of visa-related searches (users actively planning trips and researching destinations) commands '
    'higher ad rates from travel insurance, airline, and hotel advertisers.'
))

story.append(body(
    '<b>Conservative Estimate:</b> With 50,000 monthly page views, at $0.80 RPM, AdSense would generate approximately $40/month. '
    'With 200,000 monthly page views, this grows to $160/month. At 500,000 monthly page views (achievable within 12-18 months with good SEO), '
    'AdSense alone could generate $400-$750/month.'
))

story.append(add_heading('6.2 Affiliate Partnerships', s_h2, 1))

story.append(body(
    'Affiliate marketing is the highest-potential revenue stream for PakVisa. Travel affiliate programs pay generous commissions '
    'because travel purchases are high-value. The key affiliate categories relevant to PakVisa users include:'
))

aff_table = make_table(
    ['Affiliate Category', 'Commission Rate', 'Est. Monthly Revenue', 'Implementation Effort'],
    [
        ['Travel Insurance', '10-25% of premium', '$50-$300', 'Medium'],
        ['Flight Booking', '$5-$30 per booking', '$30-$150', 'Low'],
        ['Hotel Booking', '4-10% of booking', '$50-$250', 'Low'],
        ['Travel Packages', '5-15% of package', '$30-$200', 'Medium'],
        ['Currency Exchange', '$1-$5 per transaction', '$20-$80', 'Low'],
        ['SIM/eSIM Cards', '10-20% per sale', '$20-$100', 'Low'],
        ['Travel Insurance (PK)', '8-15% of premium', '$30-$150', 'Medium'],
        ['Visa Processing (Partner)', '$5-$15 per referral', '$50-$200', 'Medium'],
    ],
    col_widths=[CONTENT_W*0.28, CONTENT_W*0.22, CONTENT_W*0.22, CONTENT_W*0.24]
)
story.append(aff_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Table 4: Affiliate partnership revenue potential by category', s_caption))

story.append(add_heading('6.3 Freemium Model (Premium Subscription)', s_h2, 1))

story.append(body(
    'The freemium model offers a free tier with basic visa information and a paid tier with advanced features. '
    'PakVisa already has the UI infrastructure for this (premium gating on PDF guides, document templates, and advanced tools). '
    'The premium tier could include: PDF visa guides for individual countries, editable document templates (cover letters, '
    'invitation letters, financial statements), priority AI consultation with longer conversations, detailed country guides '
    'with embassy-specific tips, and email alerts for visa policy changes.'
))

story.append(body(
    '<b>Pricing Strategy:</b> Given the Pakistani market, pricing should be in PKR. A monthly subscription of PKR 500-999 '
    '(approximately $2-$4) or a one-time payment of PKR 1,500-2,500 ($5-$9) for an annual plan would be appropriate. '
    'Even a conservative 1% conversion rate from free to premium with 50,000 monthly users would generate 500 paying subscribers, '
    'yielding PKR 250,000-500,000 ($900-$1,800) per month.'
))

story.append(add_heading('6.4 Sponsored Listings & Partnerships', s_h2, 1))

story.append(body(
    'As traffic grows, PakVisa can offer sponsored placement to travel agencies, visa processing services, insurance companies, '
    'and airlines targeting Pakistani travelers. A "Featured Partner" badge on country pages, sponsored content in the visa alerts '
    'section, or dedicated landing pages for partners can generate $200-$1,000+ per month at scale.'
))

story.append(PageBreak())

# ════════════════════════════════════════════════════════════════
# CHAPTER 7: REVENUE PROJECTIONS
# ════════════════════════════════════════════════════════════════
story.append(add_heading('7. Conservative Revenue Projections', s_h1, 0))
story.append(section_divider())

story.append(body(
    'The following projections are deliberately conservative, based on realistic traffic growth assumptions and industry-standard '
    'monetization rates for the travel information niche in South Asian markets. These are NOT optimistic projections; they represent '
    'the floor of expected performance with solid execution.'
))

story.append(add_heading('7.1 Month-by-Month Revenue Forecast (First 12 Months)', s_h2, 1))

rev_table = make_table(
    ['Month', 'Monthly Visitors', 'Page Views', 'AdSense', 'Affiliates', 'Premium', 'Total Est.'],
    [
        ['1-2', '1,000-3,000', '5,000', '$4', '$0', '$0', '$4'],
        ['3-4', '5,000-10,000', '20,000', '$16', '$10', '$0', '$26'],
        ['5-6', '15,000-25,000', '60,000', '$48', '$40', '$30', '$118'],
        ['7-8', '30,000-50,000', '120,000', '$96', '$100', '$80', '$276'],
        ['9-10', '50,000-80,000', '250,000', '$200', '$250', '$200', '$650'],
        ['11-12', '80,000-150,000', '400,000', '$320', '$450', '$400', '$1,170'],
        ['18 (est.)', '200,000-400,000', '800,000', '$640', '$1,000', '$800', '$2,440'],
        ['24 (est.)', '400,000-800,000', '1.5M+', '$1,200', '$2,500', '$1,500', '$5,200'],
    ],
    col_widths=[CONTENT_W*0.11, CONTENT_W*0.16, CONTENT_W*0.13, CONTENT_W*0.13, CONTENT_W*0.13, CONTENT_W*0.13, CONTENT_W*0.14]
)
story.append(rev_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Table 5: Conservative monthly revenue projections (USD) for PakVisa Advisor', s_caption))

story.append(add_heading('7.2 Annual Revenue Summary', s_h2, 1))

annual_table = make_table(
    ['Period', 'Total Annual Revenue', 'Monthly Average', 'Notes'],
    [
        ['Year 1', '$2,000 - $6,000', '$170 - $500', 'SEO ramp-up phase'],
        ['Year 2', '$15,000 - $40,000', '$1,250 - $3,333', 'SEO maturity + affiliate growth'],
        ['Year 3', '$40,000 - $120,000', '$3,333 - $10,000', 'Premium model + partnerships'],
        ['Year 5+', '$150,000 - $500,000+', '$12,500 - $41,000+', 'Established platform + B2B'],
    ],
    col_widths=[CONTENT_W*0.15, CONTENT_W*0.25, CONTENT_W*0.25, CONTENT_W*0.33]
)
story.append(annual_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Table 6: Annual revenue projections by year (conservative estimates in USD)', s_caption))

story.append(callout('Important: These are CONSERVATIVE estimates. Comparable websites in the visa information space with 500K+ monthly visitors generate $5,000-$20,000+ per month. With strong execution, PakVisa could exceed these projections significantly.'))

story.append(add_heading('7.3 Revenue Assumptions & Risks', s_h2, 1))

story.append(body(
    'These projections assume: (1) Consistent SEO content creation of 4-8 country-specific articles per month, (2) Basic social media '
    'presence on at least 2 platforms, (3) At least one major affiliate partnership established by month 6, (4) Premium features '
    'launched by month 8, and (5) No major Google algorithm changes that negatively impact search rankings. '
    '<b>Risks include:</b> Google algorithm updates, competition entering the niche, slower-than-expected SEO progress, '
    'lower-than-expected affiliate conversion rates, and currency fluctuations affecting PKR-based revenue.'
))

story.append(PageBreak())

# ════════════════════════════════════════════════════════════════
# CHAPTER 8: HIGH-VALUE NEW FEATURES
# ════════════════════════════════════════════════════════════════
story.append(add_heading('8. Recommended High-Value New Features', s_h1, 0))
story.append(section_divider())

story.append(body(
    'The following features are recommended to drive traffic growth, increase user engagement, boost conversion rates, '
    'and generate additional revenue. Each feature is evaluated with its pros, cons, implementation priority, and expected impact.'
))

story.append(add_heading('8.1 Individual Country SEO Pages (/visa/[country])', s_h2, 1))

story.append(body(
    'Create dedicated, SEO-optimized pages for each of the 70 countries. Each page should contain: a comprehensive visa guide article '
    '(1,500-3,000 words), FAQ section with Schema.org structured data, embedded visa application forms/checklists, embassy contact details, '
    'user reviews and community experiences specific to that country, and related affiliate links (insurance, flights, hotels). '
    'This is the single highest-impact feature for organic traffic growth.'
))

story.append(pros_cons_table(
    [
        'Massive SEO traffic potential (long-tail keywords)',
        'Each page is a separate entry point from Google',
        'Higher ad impressions per visit',
        'Natural affiliate link placement',
        'Builds domain authority over time',
    ],
    [
        'Requires significant content creation effort',
        'Each page needs unique, quality content',
        'Ongoing maintenance for policy changes',
        'Takes 3-6 months to see SEO results',
    ]
))
story.append(Spacer(1, 4))
story.append(Paragraph('<b>Priority: CRITICAL (Implement First)</b> | <b>Impact: VERY HIGH</b> | <b>Timeline: 2-3 months</b>', ParagraphStyle('PriLabel', fontName='Carlito-Bold', fontSize=9, leading=13, textColor=SEM_SUCCESS)))

story.append(add_heading('8.2 Visa Document Templates & PDF Guides', s_h2, 1))

story.append(body(
    'Offer downloadable PDF visa guides for each country, plus editable document templates (cover letters, invitation letters, '
    'sponsorship letters, bank statement formats, NOC formats, travel itinerary templates). These are the most natural premium '
    'products for Pakistani visa applicants who desperately need guidance on document preparation.'
))

story.append(pros_cons_table(
    [
        'High perceived value (people pay for convenience)',
        'Recurring purchase as users apply for different visas',
        'Low marginal cost per sale',
        'Builds trust (users see professional documents)',
        'Can be bundled with premium subscription',
    ],
    [
        'Requires legal accuracy (liability concern)',
        'Needs regular updates as requirements change',
        'Templates must be customizable per embassy',
        'Customer support for document questions',
    ]
))
story.append(Spacer(1, 4))
story.append(Paragraph('<b>Priority: HIGH</b> | <b>Impact: HIGH (Revenue)</b> | <b>Timeline: 1-2 months</b>', ParagraphStyle('PriLabel2', fontName='Carlito-Bold', fontSize=9, leading=13, textColor=SEM_SUCCESS)))

story.append(add_heading('8.3 Real-Time Visa Policy Alerts (Push/Email)', s_h2, 1))

story.append(body(
    'Build on the existing visa alerts ticker by adding push notification and email alert capabilities. When a country changes '
    'its visa policy for Pakistani passport holders (new visa-free, policy change, fee increase), users who have "saved" or '
    '"favorited" that country receive instant notifications. This drives repeat visits and builds user dependency on the platform.'
))

story.append(add_heading('8.4 Visa Application Tracker', s_h2, 1))

story.append(body(
    'Allow users to track their visa application status. They enter their application date, embassy, and expected processing time, '
    'and PakVisa sends automated updates and reminders. This creates a daily/weekly touchpoint with users during the 2-6 week '
    'visa application process, dramatically increasing engagement and page views per user.'
))

story.append(add_heading('8.5 Urdu Language Support', s_h2, 1))

story.append(body(
    'Adding an Urdu language toggle would dramatically increase accessibility and reach. While English is common among educated '
    'Pakistanis, millions of potential users prefer Urdu. An Urdu version opens the market to a much broader audience, particularly '
    'for users from smaller cities and rural areas who are increasingly coming online but prefer content in their native language.'
))

story.append(add_heading('8.6 Travel Cost Calculator', s_h2, 1))

story.append(body(
    'An interactive calculator where users input their destination, trip duration, and travel style (budget, mid-range, luxury), '
    'and get a comprehensive cost breakdown including: visa fees, flight estimates, accommodation estimates, daily food and transport, '
    'travel insurance, and miscellaneous expenses, all in PKR. This is a high-value tool that attracts users early in the trip '
    'planning process and naturally integrates affiliate links for flights, hotels, and insurance.'
))

story.append(add_heading('8.7 Feature Priority Roadmap', s_h2, 1))

road_table = make_table(
    ['Feature', 'Priority', 'Timeline', 'Traffic Impact', 'Revenue Impact'],
    [
        ['Country SEO Pages', 'CRITICAL', 'Month 1-3', 'Very High', 'Medium'],
        ['Document Templates', 'HIGH', 'Month 1-2', 'Medium', 'High'],
        ['Urdu Language', 'HIGH', 'Month 3-4', 'Very High', 'Low'],
        ['Visa Alerts (Push/Email)', 'MEDIUM', 'Month 4-5', 'High', 'Low'],
        ['Travel Cost Calculator', 'MEDIUM', 'Month 3-5', 'High', 'High'],
        ['Visa Tracker', 'MEDIUM', 'Month 6-8', 'Medium', 'Medium'],
        ['B2B API for Agencies', 'LOW', 'Month 12+', 'Low', 'Very High'],
        ['Mobile App (PWA)', 'LOW', 'Month 9-12', 'High', 'Medium'],
    ],
    col_widths=[CONTENT_W*0.24, CONTENT_W*0.14, CONTENT_W*0.16, CONTENT_W*0.20, CONTENT_W*0.20]
)
story.append(road_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Table 7: Feature priority roadmap for PakVisa Advisor', s_caption))

story.append(PageBreak())

# ════════════════════════════════════════════════════════════════
# CHAPTER 9: MAKING VISITORS HAPPY & KEEPING THEM COMING BACK
# ════════════════════════════════════════════════════════════════
story.append(add_heading('9. Making Visitors Happy & Keeping Them Coming Back', s_h1, 0))
story.append(section_divider())

story.append(body(
    'Traffic and revenue mean nothing if visitors do not enjoy using PakVisa and do not return. This chapter focuses on the '
    'user experience principles and retention strategies that will make PakVisa a beloved tool that Pakistani travelers recommend '
    'to their friends and family.'
))

story.append(add_heading('9.1 User Experience Principles', s_h2, 1))

ux_principles = [
    '<b>Speed Is Everything:</b> The website must load in under 2 seconds on a 3G connection (common in Pakistan). Every millisecond of delay loses users. Compress images, minimize JavaScript, use server-side rendering for initial load.',
    '<b>Zero Friction:</b> No account required for core features. No pop-ups blocking content. No mandatory email capture before showing visa results. Users should get value within 3 seconds of arriving.',
    '<b>Mobile-First Design:</b> 80%+ of Pakistani internet users are on mobile. Every feature, every page, every interaction must be designed for thumb-first navigation on a phone screen.',
    '<b>Trust Through Transparency:</b> Always cite official sources (embassy websites, government pages). Show "last updated" dates on all visa information. Clearly label when information might be outdated. Users trust a tool that admits uncertainty over one that pretends to know everything.',
    '<b>Local Context:</b> Use PKR alongside USD. Show Pakistani embassy locations. Reference Pakistani banks for financial documents. Use examples relevant to Pakistani travelers (e.g., "Bank statement from HBL, UBL, or Meezan Bank").',
    '<b>Emotional Connection:</b> The community stories feature creates emotional investment. Real experiences from real Pakistanis build empathy and trust in ways that data tables cannot. Expand this with photo stories, video testimonials, and a "Share Your Experience" submission form.'
]
story.extend(bullet_list(ux_principles))

story.append(add_heading('9.2 Retention Strategies', s_h2, 1))

retention = [
    '<b>Visa Policy Email Alerts:</b> When a country changes its visa policy for Pakistani passport holders, notify all users who have favorited that country. This brings users back to the site repeatedly.',
    '<b>"Saved Trips" Feature:</b> Let users save their trip plans (destination, dates, visa status) and return to update them. This creates a personal dashboard that users check regularly.',
    '<b>Weekly Visa Digest:</b> A weekly email summarizing visa policy changes, new visa-free destinations, seasonal travel tips, and community highlights. This keeps PakVisa top-of-mind.',
    '<b>Gamification:</b> Add a "Countries Visited" tracker where users can check off countries they have visited with their Pakistani passport, earning badges and seeing their personal travel score.',
    '<b>Referral Program:</b> "Invite a friend" with rewards (e.g., unlock premium features for 7 days per referral). This turns existing users into growth engines.',
    '<b>Community Forum:</b> Allow users to ask questions and share tips. A vibrant community becomes self-sustaining content and keeps users returning daily.'
]
story.extend(bullet_list(retention))

story.append(add_heading('9.3 Key Metrics to Track', s_h2, 1))

metrics_table = make_table(
    ['Metric', 'Current Target', '6-Month Target', '12-Month Target'],
    [
        ['Monthly Visitors', 'Start', '30,000-50,000', '100,000-200,000'],
        ['Bounce Rate', '<50%', '<40%', '<35%'],
        ['Avg. Session Duration', '>2 min', '>3 min', '>4 min'],
        ['Pages per Session', '>2', '>3', '>4'],
        ['Return Visitor Rate', '>15%', '>25%', '>35%'],
        ['WhatsApp Shares/Month', 'Start', '500+', '2,000+'],
        ['Premium Conversion', 'N/A', '0.5%', '1.5%'],
        ['Email List Size', '0', '2,000', '10,000'],
    ],
    col_widths=[CONTENT_W*0.25, CONTENT_W*0.22, CONTENT_W*0.27, CONTENT_W*0.27]
)
story.append(metrics_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Table 8: Key performance metrics and targets for PakVisa Advisor', s_caption))

story.append(PageBreak())

# ════════════════════════════════════════════════════════════════
# CHAPTER 10: STRATEGY PROS AND CONS
# ════════════════════════════════════════════════════════════════
story.append(add_heading('10. Strategy Pros and Cons Summary', s_h1, 0))
story.append(section_divider())

story.append(body(
    'Every strategy has trade-offs. This chapter provides an honest assessment of the pros and cons of the overall PakVisa growth strategy, '
    'so you can make informed decisions about where to focus your time and resources.'
))

story.append(pros_cons_table(
    [
        '<b>SEO-driven traffic</b> is free and sustainable long-term',
        '<b>Free core product</b> builds massive trust and goodwill',
        '<b>AI features</b> create a genuine competitive moat',
        '<b>WhatsApp viral loop</b> is uniquely suited to Pakistani market',
        '<b>Pakistan-specific niche</b> has very low competition',
        '<b>Multiple revenue streams</b> reduce risk of any single failure',
        '<b>Community content</b> creates organic, user-generated SEO value',
        '<b>Freemium model</b> allows monetization without alienating free users',
        '<b>Low operating costs</b> (hosting, AI API, basic maintenance)',
        '<b>Weak passport</b> means high-intent, repeat usage behavior',
    ],
    [
        '<b>SEO takes 3-6 months</b> to show significant results',
        '<b>Content creation</b> requires ongoing investment',
        '<b>Revenue starts slow</b> ($4-$100/month for first 4 months)',
        '<b>Data accuracy</b> is critical (wrong visa info = lost trust)',
        '<b>Competition risk</b> if market proves lucrative',
        '<b>Pakistani RPM</b> is lower than US/UK traffic',
        '<b>Google algorithm changes</b> can impact traffic overnight',
        '<b>Premium conversion</b> in Pakistan may be lower than expected',
        '<b>Affiliate programs</b> require minimum traffic thresholds',
        '<b>Currency risk</b> if pricing in PKR with USD costs',
    ]
))

story.append(Spacer(1, 12))

story.append(body(
    '<b>Overall Assessment:</b> The pros significantly outweigh the cons. The main challenges are patience (SEO takes time) and consistency '
    '(content creation must be ongoing). The competitive moat created by Pakistan-specific AI features, community content, and the WhatsApp '
    'viral loop makes it very difficult for a new entrant to replicate PakVisa\'s value proposition. The free-to-use core product ensures '
    'that user trust remains high while premium features and affiliate partnerships provide monetization without compromising the user experience.'
))

story.append(PageBreak())

# ════════════════════════════════════════════════════════════════
# CHAPTER 11: CONCLUSION & NEXT STEPS
# ════════════════════════════════════════════════════════════════
story.append(add_heading('11. Conclusion & Recommended Next Steps', s_h1, 0))
story.append(section_divider())

story.append(body(
    'PakVisa Advisor is positioned in a massive, growing, and underserved market. No other platform offers a free, AI-powered visa '
    'checking tool specifically designed for Pakistani passport holders with local currency pricing, community experiences, and social '
    'sharing. The online visa services market is growing at 11% annually, Pakistani outbound travel spending reached $2.4 billion in 2024, '
    'and over 135 million Pakistanis are now online. The opportunity is real and substantial.'
))

story.append(body(
    'Conservative revenue projections show that PakVisa can generate $2,000-$6,000 in its first year, $15,000-$40,000 in year two, '
    'and $40,000-$120,000+ by year three, with potential for much higher figures with strong execution. These projections are based on '
    'industry-standard monetization rates and realistic traffic growth assumptions for the Pakistani market.'
))

story.append(add_heading('11.1 Immediate Next Steps (Next 30 Days)', s_h2, 1))

next_steps = [
    '<b>Week 1-2:</b> Launch individual country SEO pages for the top 20 most-searched countries (UAE, Turkey, Saudi Arabia, Malaysia, Thailand, UK, USA, China, Qatar, Oman, etc.). Each page should have 1,500+ words, FAQ with Schema.org markup, and affiliate links.',
    '<b>Week 2-3:</b> Set up Google AdSense and 2-3 travel affiliate partnerships (travel insurance, hotel booking, flight comparison). Place affiliate links naturally within country pages and in the cost breakdown sections.',
    '<b>Week 3-4:</b> Create social media accounts on YouTube Shorts, Instagram, and TikTok. Post 3-5 short-form visa tip videos per week. Create a content calendar for the next 3 months.',
    '<b>Week 4:</b> Set up email collection (simple "Get visa updates" signup). Begin building an email list. Launch a weekly visa digest newsletter.',
    '<b>Ongoing:</b> Monitor Google Search Console for ranking progress. Create 4-8 new country pages per month. Respond to community submissions. Update visa alerts as policies change.'
]
story.extend(bullet_list(next_steps))

story.append(Spacer(1, 12))

story.append(callout('The single most important action you can take right now is creating SEO-optimized country pages. This is the foundation of all organic traffic and revenue growth. Everything else builds on top of this.'))

story.append(Spacer(1, 20))
story.append(HRFlowable(width="100%", thickness=1.5, color=HEADER_FILL, spaceBefore=12, spaceAfter=12))

story.append(Paragraph(
    'This report was prepared as a strategic analysis for PakVisa Advisor. All revenue projections are conservative estimates '
    'based on industry benchmarks and market data. Actual results may vary based on execution quality, market conditions, '
    'and competitive dynamics. This document is confidential and intended for internal decision-making purposes.',
    ParagraphStyle('Disclaimer', fontName='Tinos-Italic', fontSize=8, leading=12, textColor=TEXT_MUTED, alignment=TA_LEFT)
))

# ━━ Build PDF ━━
pdf_metrics = {
    'title': 'PakVisa Advisor - Growth Strategy & Revenue Analysis Report',
    'author': 'PakVisa Advisory',
    'subject': 'Business analysis, traffic growth, revenue projections, and feature roadmap for PakVisa Advisor',
    'creator': 'PakVisa Analytics',
}

doc = TocDocTemplate(
    OUTPUT_PATH,
    pagesize=A4,
    leftMargin=LEFT_M,
    rightMargin=RIGHT_M,
    topMargin=TOP_M,
    bottomMargin=BOTTOM_M,
    **pdf_metrics,
)

# Page number footer
def add_page_number(canvas, doc):
    page_num = canvas.getPageNumber()
    if page_num > 1:  # Skip cover page
        text = f"PakVisa Growth Strategy Report  |  Page {page_num}"
        canvas.saveState()
        canvas.setFont('Tinos', 8)
        canvas.setFillColor(TEXT_MUTED)
        canvas.drawCentredString(PAGE_W / 2, 25, text)
        canvas.restoreState()

from reportlab.platypus import PageTemplate, Frame
frame = Frame(LEFT_M, BOTTOM_M, CONTENT_W, PAGE_H - TOP_M - BOTTOM_M, id='normal')
template = PageTemplate(id='main', frames=frame, onPage=add_page_number)
doc.addPageTemplates([template])

doc.multiBuild(story)
print(f"PDF generated successfully: {OUTPUT_PATH}")
print(f"File size: {os.path.getsize(OUTPUT_PATH) / 1024:.1f} KB")
