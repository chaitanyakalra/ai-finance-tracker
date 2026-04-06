import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TOKENS = JSON.parse(fs.readFileSync(join(__dirname, 'test-tokens.json'), 'utf8'));
const BASE_URL = 'http://localhost:8000/api';

async function test(name, fn) {
    try {
        console.log(`\nRUNNING: ${name}`);
        await fn();
        console.log(`✅ PASSED: ${name}`);
    } catch (err) {
        console.error(`❌ FAILED: ${name}`);
        console.error(`   Error: ${err.message}`);
        if (err.response) {
            console.error(`   Status: ${err.response.status}`);
            console.error(`   Body: ${JSON.stringify(err.response.body, null, 2)}`);
        }
        throw err; // Stop at first failure for better debugging
    }
}

async function request(path, options = {}) {
    const url = `${BASE_URL}${path}`;
    const headers = {
        'Content-Type': 'application/json',
        ...(options.token ? { 'Authorization': `Bearer ${options.token}` } : {}),
        ...options.headers
    };

    const res = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(`Request failed with status ${res.status}`);
        err.response = { status: res.status, body };
        throw err;
    }
    return { status: res.status, body };
}

async function runTests() {
    console.log('🔄 SETTING UP: Re-seeding test users...');
    try {
        // Run the seed script directly to ensure fresh tokens and role state
        const { execSync } = await import('child_process');
        execSync('node scripts/seed-test-users.js', { stdio: 'inherit', cwd: join(__dirname, '..') });
    } catch (err) {
        console.error('❌ SETUP FAILED: Could not seed test users.');
        process.exit(1);
    }

    const TOKENS = JSON.parse(fs.readFileSync(join(__dirname, 'test-tokens.json'), 'utf8'));
    const admin = TOKENS.admin.token;
    const analyst = TOKENS.analyst.token;
    const viewer = TOKENS.viewer.token;

    // --- AUTH MIDDLEWARE ---
    await test('Request with no token → 401', async () => {
        try { await request('/expenses'); } catch (e) { if (e.response.status !== 401) throw e; return; }
        throw new Error('Should have failed');
    });

    await test('Request with invalid token → 401', async () => {
        try { await request('/expenses', { token: 'invalid.token.here' }); } catch (e) { if (e.response.status !== 401) throw e; return; }
        throw new Error('Should have failed');
    });

    // --- RBAC - VIEWER ---
    await test('Viewer can GET /expenses → 200', async () => {
        await request('/expenses', { token: viewer });
    });

    await test('Viewer cannot POST /expenses → 403', async () => {
        try { 
            await request('/expenses', { 
                token: viewer, 
                method: 'POST', 
                body: { amount: 100, category: 'Food', date: new Date(), type: 'expense', description: 'Test' } 
            }); 
        } catch (e) { 
            if (e.response.status !== 403) throw e; 
            if (!e.response.body.userRole || (!e.response.body.requiredRoles && !e.response.body.requiredMinimumRole)) throw new Error('Missing role metadata in 403');
            return; 
        }
        throw new Error('Should have failed');
    });

    // --- RBAC - ANALYST ---
    let analystExpenseId;
    await test('Analyst can POST /expenses → 201', async () => {
        const { body } = await request('/expenses', { 
            token: analyst, 
            method: 'POST', 
            body: { amount: 50, category: 'Transport', date: new Date(), type: 'expense', description: 'Analyst Test' } 
        });
        analystExpenseId = body.id || body._id;
    });

    await test('Analyst cannot list users → 403', async () => {
        try { await request('/users', { token: analyst }); } catch (e) { if (e.response.status !== 403) throw e; return; }
        throw new Error('Should have failed');
    });

    // --- RBAC - ADMIN ---
    await test('Admin can list users → 200', async () => {
        await request('/users', { token: admin });
    });

    // --- ROLE REQUEST FLOW ---
    let requestId;
    await test('Viewer requests role upgrade → 201', async () => {
        const { body } = await request('/users/request-role', {
            token: viewer,
            method: 'POST',
            body: { requestedRole: 'analyst', reason: 'I need to add financial data for the team.' }
        });
        requestId = body.roleRequest.id;
    });

    await test('Viewer cannot request same role again → 409', async () => {
        try {
            await request('/users/request-role', {
                token: viewer,
                method: 'POST',
                body: { requestedRole: 'analyst', reason: 'Duplicate request test duplicate request test.' }
            });
        } catch (e) { if (e.response.status !== 409) throw e; return; }
        throw new Error('Should have failed');
    });

    await test('Viewer cannot request lower/equal role → 400', async () => {
        try {
            await request('/users/request-role', {
                token: viewer,
                method: 'POST',
                body: { requestedRole: 'viewer', reason: 'This should logically fail as I already am a viewer.' }
            });
        } catch (e) { if (e.response.status !== 400) throw e; return; }
        throw new Error('Should have failed');
    });

    await test('Admin sees pending requests → 200', async () => {
        const { body } = await request('/admin/role-requests', { token: admin });
        const found = body.requests.some(r => r.id === requestId);
        if (!found) throw new Error('Pending request not found in admin list');
    });

    await test('Admin rejects first (for testing history), then Viewer requests again, then Admin approves', async () => {
        // 1. Reject the first one
        await request(`/admin/role-requests/${requestId}/reject`, {
            token: admin,
            method: 'POST',
            body: { reason: 'Please provide more details in your next request.' }
        });

        // 2. Viewer check history
        const { body: hist } = await request('/users/my-requests', { token: viewer });
        if (hist.requests[0].status !== 'REJECTED') throw new Error('Status not REJECTED');

        // 3. Request again
        const { body: req2 } = await request('/users/request-role', {
            token: viewer,
            method: 'POST',
            body: { requestedRole: 'analyst', reason: 'I am the primary financial officer for this project now.' }
        });
        const requestId2 = req2.roleRequest.id;

        // 4. Approve
        await request(`/admin/role-requests/${requestId2}/approve`, {
            token: admin,
            method: 'POST',
            body: { adminNotes: 'Verified position.' }
        });

        // 5. Verify role changed
        const { body: me } = await request('/users/me', { token: viewer });
        if (me.user.role !== 'analyst') throw new Error(`Role should be analyst, got ${me.user.role}`);
    });

    // --- DASHBOARD ---
    await test('Dashboard returns rounded numbers → 200', async () => {
        const { body } = await request('/dashboard', { token: analyst });
        if (body.summary.totalExpenses % 1 !== 0 && String(body.summary.totalExpenses).split('.')[1]?.length > 2) {
            throw new Error(`Unrounded totalExpenses: ${body.summary.totalExpenses}`);
        }
    });

    console.log('\n--- ALL TESTS COMPLETED ---');
}

runTests().catch(console.error);
