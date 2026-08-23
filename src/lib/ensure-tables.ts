import { createClient, type Client } from '@libsql/client';

let ensured = false;
let tursoClient: Client | null = null;

function getTursoClient(): Client | null {
  if (tursoClient) return tursoClient;
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) return null;
  tursoClient = createClient({ url, authToken: token });
  return tursoClient;
}

const TABLES_SQL: string[] = [
  `CREATE TABLE IF NOT EXISTS "User" ("id" TEXT NOT NULL PRIMARY KEY,"email" TEXT NOT NULL,"passwordHash" TEXT NOT NULL DEFAULT '',"fullName" TEXT NOT NULL DEFAULT '',"phone" TEXT NOT NULL DEFAULT '',"role" TEXT NOT NULL DEFAULT 'free',"proExpiresAt" DATETIME,"isActive" INTEGER NOT NULL DEFAULT 1,"lastLogin" DATETIME,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE("email"))`,
  `CREATE TABLE IF NOT EXISTS "AiUsageLog" ("id" TEXT NOT NULL PRIMARY KEY,"userId" TEXT NOT NULL DEFAULT '',"message" TEXT NOT NULL DEFAULT '',"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS "AiUsageLog_userId_idx" ON "AiUsageLog"("userId")`,
  `CREATE INDEX IF NOT EXISTS "AiUsageLog_createdAt_idx" ON "AiUsageLog"("createdAt")`,
  `CREATE TABLE IF NOT EXISTS "PaymentProof" ("id" TEXT NOT NULL PRIMARY KEY,"userId" TEXT NOT NULL DEFAULT '',"fileName" TEXT NOT NULL DEFAULT '',"filePath" TEXT NOT NULL DEFAULT '',"fileSize" INTEGER NOT NULL DEFAULT 0,"status" TEXT NOT NULL DEFAULT 'pending',"userNote" TEXT NOT NULL DEFAULT '',"adminNote" TEXT NOT NULL DEFAULT '',"reviewedAt" DATETIME,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS "PaymentProof_userId_idx" ON "PaymentProof"("userId")`,
  `CREATE TABLE IF NOT EXISTS "Country" ("id" TEXT NOT NULL PRIMARY KEY,"code" TEXT NOT NULL,"name" TEXT NOT NULL DEFAULT '',"flagEmoji" TEXT NOT NULL DEFAULT '',"flagUrl" TEXT NOT NULL DEFAULT '',"continent" TEXT NOT NULL DEFAULT '',"currency" TEXT NOT NULL DEFAULT '',"currencyCode" TEXT NOT NULL DEFAULT '',"timezone" TEXT NOT NULL DEFAULT '',"visaFree" INTEGER NOT NULL DEFAULT 0,"visaOnArrival" INTEGER NOT NULL DEFAULT 0,"etaAvailable" INTEGER NOT NULL DEFAULT 0,"safetyRating" INTEGER NOT NULL DEFAULT 5,"safetySummary" TEXT NOT NULL DEFAULT '',"bestTravelMonths" TEXT NOT NULL DEFAULT '',"avgTempC" TEXT NOT NULL DEFAULT '25',"monthlyTemps" TEXT NOT NULL DEFAULT '{}',"processingDaysMin" INTEGER NOT NULL DEFAULT 5,"processingDaysMax" INTEGER NOT NULL DEFAULT 30,"sourceUrl" TEXT NOT NULL DEFAULT '',"fetchTimestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"fetchHash" TEXT NOT NULL DEFAULT '',"parserVersion" TEXT NOT NULL DEFAULT '1.0.0',"parserConfidence" REAL NOT NULL DEFAULT 0.8,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE("code"))`,
  `CREATE TABLE IF NOT EXISTS "VisaType" ("id" TEXT NOT NULL PRIMARY KEY,"countryId" TEXT NOT NULL DEFAULT '',"type" TEXT NOT NULL DEFAULT '',"description" TEXT NOT NULL DEFAULT '',"maxDuration" TEXT NOT NULL DEFAULT '',"extensions" INTEGER NOT NULL DEFAULT 0,"multipleEntry" INTEGER NOT NULL DEFAULT 0,"sourceUrl" TEXT NOT NULL DEFAULT '',"fetchTimestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"parserConfidence" REAL NOT NULL DEFAULT 0.8,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS "VisaRequirement" ("id" TEXT NOT NULL PRIMARY KEY,"countryId" TEXT NOT NULL DEFAULT '',"visaTypeId" TEXT,"category" TEXT NOT NULL DEFAULT '',"requirement" TEXT NOT NULL DEFAULT '',"mandatory" INTEGER NOT NULL DEFAULT 1,"description" TEXT NOT NULL DEFAULT '',"scoringWeight" REAL NOT NULL DEFAULT 0.0,"sourceUrl" TEXT NOT NULL DEFAULT '',"fetchTimestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"fetchHash" TEXT NOT NULL DEFAULT '',"parserVersion" TEXT NOT NULL DEFAULT '1.0.0',"parserConfidence" REAL NOT NULL DEFAULT 0.8,"needsReview" INTEGER NOT NULL DEFAULT 0,"reviewNote" TEXT NOT NULL DEFAULT '',"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS "VisaRequirement_countryId_idx" ON "VisaRequirement"("countryId")`,
  `CREATE TABLE IF NOT EXISTS "CostProfile" ("id" TEXT NOT NULL PRIMARY KEY,"countryId" TEXT NOT NULL DEFAULT '',"visaFeeUSD" REAL NOT NULL DEFAULT 0,"serviceFeeUSD" REAL NOT NULL DEFAULT 0,"processingDays" INTEGER NOT NULL DEFAULT 10,"monthlyLivingUSD" REAL NOT NULL DEFAULT 1000,"monthlyRentUSD" REAL NOT NULL DEFAULT 500,"monthlyFoodUSD" REAL NOT NULL DEFAULT 300,"monthlyTransportUSD" REAL NOT NULL DEFAULT 100,"healthInsuranceUSD" REAL NOT NULL DEFAULT 50,"totalMonthlyUSD" REAL NOT NULL DEFAULT 1000,"currency" TEXT NOT NULL DEFAULT '',"sourceUrl" TEXT NOT NULL DEFAULT '',"fetchTimestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"parserConfidence" REAL NOT NULL DEFAULT 0.8,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS "UserProfile" ("id" TEXT NOT NULL PRIMARY KEY,"fullName" TEXT NOT NULL DEFAULT '',"age" INTEGER NOT NULL DEFAULT 25,"gender" TEXT NOT NULL DEFAULT '',"nationality" TEXT NOT NULL DEFAULT 'Pakistani',"passportNumber" TEXT NOT NULL DEFAULT '',"passportExpiry" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"occupation" TEXT NOT NULL DEFAULT '',"monthlyIncomeUSD" REAL NOT NULL DEFAULT 0,"savingsUSD" REAL NOT NULL DEFAULT 0,"education" TEXT NOT NULL DEFAULT '',"languages" TEXT NOT NULL DEFAULT '[]',"hasCriminalRecord" INTEGER NOT NULL DEFAULT 0,"hasPriorTravel" INTEGER NOT NULL DEFAULT 0,"priorCountries" TEXT NOT NULL DEFAULT '[]',"hasHealthInsurance" INTEGER NOT NULL DEFAULT 0,"hasSponsor" INTEGER NOT NULL DEFAULT 0,"sponsorRelation" TEXT NOT NULL DEFAULT '',"sponsorIncomeUSD" REAL NOT NULL DEFAULT 0,"travelPurpose" TEXT NOT NULL DEFAULT '',"intendedStayDays" INTEGER NOT NULL DEFAULT 30,"hasReturnTicket" INTEGER NOT NULL DEFAULT 0,"hasHotelBooking" INTEGER NOT NULL DEFAULT 0,"budgetUSD" REAL NOT NULL DEFAULT 0,"maritalStatus" TEXT NOT NULL DEFAULT '',"dependents" INTEGER NOT NULL DEFAULT 0,"hasSpecialNeeds" INTEGER NOT NULL DEFAULT 0,"additionalNotes" TEXT NOT NULL DEFAULT '',"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS "Session" ("id" TEXT NOT NULL PRIMARY KEY,"userProfileId" TEXT NOT NULL DEFAULT '',"status" TEXT NOT NULL DEFAULT 'in_progress',"questionnaireProgress" REAL NOT NULL DEFAULT 0,"currentStep" INTEGER NOT NULL DEFAULT 0,"answers" TEXT NOT NULL DEFAULT '{}',"scores" TEXT NOT NULL DEFAULT '{}',"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS "Session_userProfileId_idx" ON "Session"("userProfileId")`,
  `CREATE TABLE IF NOT EXISTS "AuditLog" ("id" TEXT NOT NULL PRIMARY KEY,"sessionId" TEXT NOT NULL DEFAULT '',"action" TEXT NOT NULL DEFAULT '',"countryId" TEXT,"component" TEXT NOT NULL DEFAULT '',"score" REAL,"weight" REAL,"multiplier" REAL,"confidence" REAL,"sourceUrl" TEXT,"details" TEXT NOT NULL DEFAULT '',"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS "ScoringWeight" ("id" TEXT NOT NULL PRIMARY KEY,"category" TEXT NOT NULL DEFAULT '',"weight" REAL NOT NULL DEFAULT 0.0,"editable" INTEGER NOT NULL DEFAULT 1,"description" TEXT NOT NULL DEFAULT '',"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE("category"))`,
  `CREATE TABLE IF NOT EXISTS "AdminUser" ("id" TEXT NOT NULL PRIMARY KEY,"username" TEXT NOT NULL DEFAULT '',"passwordHash" TEXT NOT NULL DEFAULT '',"role" TEXT NOT NULL DEFAULT 'admin',"permissions" TEXT NOT NULL DEFAULT 'full',"isOnline" INTEGER NOT NULL DEFAULT 0,"lastLogin" DATETIME,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE("username"))`,
  `CREATE TABLE IF NOT EXISTS "SiteSettings" ("id" TEXT NOT NULL PRIMARY KEY,"key" TEXT NOT NULL DEFAULT '',"value" TEXT NOT NULL DEFAULT '',"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE("key"))`,
  `CREATE TABLE IF NOT EXISTS "NewsletterSubscriber" ("id" TEXT NOT NULL PRIMARY KEY,"email" TEXT NOT NULL DEFAULT '',"subscribedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"isActive" INTEGER NOT NULL DEFAULT 1,UNIQUE("email"))`,
  `CREATE TABLE IF NOT EXISTS "AnalyticsEvent" ("id" TEXT NOT NULL PRIMARY KEY,"event" TEXT NOT NULL DEFAULT '',"data" TEXT NOT NULL DEFAULT '{}',"ip" TEXT NOT NULL DEFAULT 'unknown',"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "AnalyticsEvent_event_idx" ON "AnalyticsEvent"("event")`,
  `CREATE TABLE IF NOT EXISTS "AdminNotification" ("id" TEXT NOT NULL PRIMARY KEY,"type" TEXT NOT NULL DEFAULT 'info',"title" TEXT NOT NULL DEFAULT '',"message" TEXT NOT NULL DEFAULT '',"isRead" INTEGER NOT NULL DEFAULT 0,"data" TEXT NOT NULL DEFAULT '{}',"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS "AdminNotification_isRead_idx" ON "AdminNotification"("isRead")`,
  `CREATE INDEX IF NOT EXISTS "AdminNotification_createdAt_idx" ON "AdminNotification"("createdAt")`,
  `CREATE TABLE IF NOT EXISTS "ContactMessage" ("id" TEXT NOT NULL PRIMARY KEY,"name" TEXT NOT NULL DEFAULT '',"email" TEXT NOT NULL DEFAULT '',"subject" TEXT NOT NULL DEFAULT '',"message" TEXT NOT NULL DEFAULT '',"isRead" INTEGER NOT NULL DEFAULT 0,"isReplied" INTEGER NOT NULL DEFAULT 0,"reply" TEXT NOT NULL DEFAULT '',"repliedAt" DATETIME,"ip" TEXT NOT NULL DEFAULT 'unknown',"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS "ContactMessage_isRead_idx" ON "ContactMessage"("isRead")`,
  `CREATE INDEX IF NOT EXISTS "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt")`,
  `CREATE TABLE IF NOT EXISTS "VisitorSession" ("id" TEXT NOT NULL PRIMARY KEY,"sessionId" TEXT NOT NULL DEFAULT '',"ip" TEXT NOT NULL DEFAULT 'unknown',"country" TEXT NOT NULL DEFAULT '',"city" TEXT NOT NULL DEFAULT '',"page" TEXT NOT NULL DEFAULT '',"referrer" TEXT NOT NULL DEFAULT '',"referrerCategory" TEXT NOT NULL DEFAULT 'direct',"userAgent" TEXT NOT NULL DEFAULT '',"device" TEXT NOT NULL DEFAULT '',"browser" TEXT NOT NULL DEFAULT '',"os" TEXT NOT NULL DEFAULT '',"lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS "VisitorSession_sessionId_idx" ON "VisitorSession"("sessionId")`,
  `CREATE INDEX IF NOT EXISTS "VisitorSession_lastSeen_idx" ON "VisitorSession"("lastSeen")`,
  `CREATE INDEX IF NOT EXISTS "VisitorSession_createdAt_idx" ON "VisitorSession"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "VisitorSession_country_idx" ON "VisitorSession"("country")`,
  `CREATE INDEX IF NOT EXISTS "VisitorSession_referrerCategory_idx" ON "VisitorSession"("referrerCategory")`,
  `CREATE INDEX IF NOT EXISTS "VisitorSession_device_idx" ON "VisitorSession"("device")`,
  `CREATE TABLE IF NOT EXISTS "SearchLog" ("id" TEXT NOT NULL PRIMARY KEY,"query" TEXT NOT NULL DEFAULT '',"ip" TEXT NOT NULL DEFAULT 'unknown',"results" INTEGER NOT NULL DEFAULT 0,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS "SearchLog_query_idx" ON "SearchLog"("query")`,
  `CREATE INDEX IF NOT EXISTS "SearchLog_createdAt_idx" ON "SearchLog"("createdAt")`,
  `CREATE TABLE IF NOT EXISTS "SecurityLog" ("id" TEXT NOT NULL PRIMARY KEY,"action" TEXT NOT NULL DEFAULT '',"email" TEXT NOT NULL DEFAULT '',"ip" TEXT NOT NULL DEFAULT 'unknown',"userAgent" TEXT NOT NULL DEFAULT '',"success" INTEGER NOT NULL DEFAULT 1,"details" TEXT NOT NULL DEFAULT '',"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS "SecurityLog_action_idx" ON "SecurityLog"("action")`,
  `CREATE INDEX IF NOT EXISTS "SecurityLog_createdAt_idx" ON "SecurityLog"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "SecurityLog_success_idx" ON "SecurityLog"("success")`,
  `CREATE TABLE IF NOT EXISTS "AffiliateClick" ("id" TEXT NOT NULL PRIMARY KEY,"partner" TEXT NOT NULL DEFAULT '',"country" TEXT NOT NULL DEFAULT '',"ip" TEXT NOT NULL DEFAULT 'unknown',"sessionId" TEXT NOT NULL DEFAULT '',"page" TEXT NOT NULL DEFAULT '',"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS "AffiliateClick_partner_idx" ON "AffiliateClick"("partner")`,
  `CREATE INDEX IF NOT EXISTS "AffiliateClick_createdAt_idx" ON "AffiliateClick"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "AffiliateClick_country_idx" ON "AffiliateClick"("country")`,
];

// ALTER TABLE statements — may fail if column already exists, that's OK
const ALTER_SQL: string[] = [
  `ALTER TABLE "VisitorSession" ADD COLUMN "referrerCategory" TEXT NOT NULL DEFAULT 'direct'`,
  `ALTER TABLE "VisitorSession" ADD COLUMN "device" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "VisitorSession" ADD COLUMN "browser" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "VisitorSession" ADD COLUMN "os" TEXT NOT NULL DEFAULT ''`,
];

export async function ensureAllTables(): Promise<void> {
  if (ensured) return;
  if (process.env.NODE_ENV !== 'production') { ensured = true; return; }
  const client = getTursoClient();
  if (!client) { console.warn('[ensure-tables] No TURSO creds, skipping'); ensured = true; return; }
  try {
    for (const sql of TABLES_SQL) { await client.execute(sql); }
    for (const sql of ALTER_SQL) { try { await client.execute(sql); } catch { /* column may already exist */ } }
    console.log('[ensure-tables] All tables ensured');
  } catch (err) { console.error('[ensure-tables] Error:', err); }
  ensured = true;
}
export const ensureVisitorTable = ensureAllTables;
