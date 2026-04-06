import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TOKENS = JSON.parse(fs.readFileSync(join(__dirname, 'test-tokens.json'), 'utf8'));
const BASE_URL = 'http://localhost:8000/api';

async function debugExpense() {
    const analyst = TOKENS.analyst.token;
    const res = await fetch(`${BASE_URL}/expenses`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${analyst}`
        },
        body: JSON.stringify({
            amount: 50.5,
            category: 'Food',
            date: new Date().toISOString(),
            type: 'expense',
            description: 'Debug Expense'
        })
    });

    const body = await res.json().catch(() => ({}));
    console.log('Status:', res.status);
    console.log('Body:', JSON.stringify(body, null, 2));
}

debugExpense().catch(console.error);
