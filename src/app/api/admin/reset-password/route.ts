import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// TEMPORARY: Reset admin password.
// This route should be removed after use for security.

export async function GET() {
  const html = `<!DOCTYPE html>
<html><head><title>Admin Password Reset</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 420px; margin: 60px auto; padding: 20px; background: #f9fafb; }
  .card { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  h1 { font-size: 20px; margin: 0 0 4px; color: #111; }
  p.sub { color: #666; font-size: 14px; margin: 0 0 24px; }
  label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
  input { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; margin-bottom: 16px; }
  button { width: 100%; padding: 12px; background: #059669; color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; }
  button:hover { background: #047857; }
  #result { margin-top: 16px; padding: 12px; border-radius: 8px; font-size: 14px; display: none; }
  .ok { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
  .err { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
  .warn { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
</style></head>
<body>
<div class="card">
  <h1>🔐 Admin Password Reset</h1>
  <p class="sub">Set a new password for your admin account</p>
  <label for="u">Username</label>
  <input id="u" placeholder="e.g. admin" />
  <label for="p">New Password (min 8 chars)</label>
  <input id="p" type="password" placeholder="Your new strong password" />
  <button onclick="reset()">Reset Password</button>
  <div id="result"></div>
</div>
<script>
function reset() {
  const u = document.getElementById('u').value.trim();
  const p = document.getElementById('p').value;
  const r = document.getElementById('result');
  if (!u || !p) { r.className='err'; r.style.display='block'; r.textContent='Please fill in both fields.'; return; }
  if (p.length < 8) { r.className='err'; r.style.display='block'; r.textContent='Password must be at least 8 characters.'; return; }
  r.className='warn'; r.style.display='block'; r.textContent='Resetting...';
  fetch('/api/admin/reset-password', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username: u, newPassword: p})
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) { r.className='ok'; r.textContent = '✅ ' + data.message; }
    else { r.className='err'; r.textContent = '❌ ' + data.error + (data.availableUsernames ? ' (existing: ' + data.availableUsernames.join(', ') + ')' : ''); }
    r.style.display='block';
  })
  .catch(e => { r.className='err'; r.style.display='block'; r.textContent='Connection error.'; });
}
</script></body></html>`;
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, newPassword } = body;

    if (!username || !newPassword) {
      return NextResponse.json({
        success: false,
        error: 'Username and newPassword are required',
      }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({
        success: false,
        error: 'Password must be at least 8 characters',
      }, { status: 400 });
    }

    const admin = await db.adminUser.findUnique({
      where: { username: username.trim() },
    });

    if (!admin) {
      const allAdmins = await db.adminUser.findMany({
        select: { username: true, createdAt: true },
      });
      return NextResponse.json({
        success: false,
        error: `Username "${username.trim()}" not found`,
        availableUsernames: allAdmins.map(a => a.username),
      }, { status: 404 });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await db.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash: hash },
    });

    return NextResponse.json({
      success: true,
      message: `Password reset for "${admin.username}"`,
    });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json(
      { success: false, error: 'Reset failed' },
      { status: 500 }
    );
  }
}