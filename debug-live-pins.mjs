/**
 * 🔍 DIAGNOSTIC V2: Check user_live_status columns + RPC
 * Run: node debug-live-pins.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sygnesgnnaoadhrzacmp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5Z25lc2dubmFvYWRocnphY21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxOTI1MjYsImV4cCI6MjA2Nzc2ODUyNn0.uWnVOSBcebK_DY3f1X9Rqj5Niu21onrX7Lqg9QfXzQ4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
    console.log('=== 🔍 DIAGNOSTIC V2 ===\n');

    // Step 1: Get actual columns of user_live_status using select *
    console.log('--- Step 1: user_live_status columns ---');
    const { data: sample, error: sampleErr } = await supabase
        .from('user_live_status')
        .select('*')
        .limit(1);

    if (sampleErr) {
        console.error('❌ Error:', sampleErr.message, sampleErr.code, sampleErr.hint);
    } else if (sample && sample.length > 0) {
        console.log('✅ Column names:', Object.keys(sample[0]));
        console.log('📦 Sample row:', JSON.stringify(sample[0], null, 2));
    } else {
        console.log('⚠️ Table exists but is empty');
    }

    // Step 2: Check tracking_logs table
    console.log('\n--- Step 2: tracking_logs columns ---');
    const { data: trackSample, error: trackErr } = await supabase
        .from('tracking_logs')
        .select('*')
        .limit(1);

    if (trackErr) {
        console.error('❌ Error:', trackErr.message);
    } else if (trackSample && trackSample.length > 0) {
        console.log('✅ Column names:', Object.keys(trackSample[0]));
        console.log('📦 Sample row:', JSON.stringify(trackSample[0], null, 2));
    } else {
        console.log('⚠️ Table empty');
    }

    // Step 3: Try RPC with a broader approach
    console.log('\n--- Step 3: Calling get_live_map_pins ---');

    // First, get any client ID from accounts or client_users
    const { data: anyClient, error: clientErr } = await supabase
        .from('client_users')
        .select('client_id')
        .limit(5);

    if (clientErr) {
        console.error('❌ client_users error:', clientErr.message);
    } else {
        const uniqueClients = [...new Set((anyClient || []).map(c => c.client_id))];
        console.log('📍 Available client IDs:', uniqueClients);

        for (const cid of uniqueClients.slice(0, 3)) {
            console.log(`\n  🔄 RPC call for client: ${cid}`);
            const { data, error } = await supabase.rpc('get_live_map_pins', {
                p_client_id: cid,
            });

            if (error) {
                console.error('  ❌ RPC Error:', error.message, error.code, error.hint);
            } else {
                const arr = Array.isArray(data) ? data : [];
                console.log('  📦 Response type:', typeof data, '| Is Array:', Array.isArray(data), '| Count:', arr.length);
                if (arr.length > 0) {
                    console.log('  📦 First pin keys:', Object.keys(arr[0]));
                    arr.forEach((pin, i) => {
                        console.log(`  📌 Pin ${i + 1}:`, JSON.stringify(pin, null, 4));
                    });
                } else if (data && !Array.isArray(data)) {
                    console.log('  📦 Response keys:', Object.keys(data));
                    console.log('  📦 Full:', JSON.stringify(data, null, 2));
                }
            }
        }
    }

    // Step 4: Check RPC function definition
    console.log('\n--- Step 4: RPC function signature ---');
    const { data: funcDef, error: funcErr } = await supabase.rpc('get_live_map_pins', {
        p_client_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
    });

    if (funcErr) {
        console.log('📋 RPC error with dummy UUID:', funcErr.message);
    } else {
        console.log('📋 RPC response with dummy UUID:', JSON.stringify(funcDef, null, 2));
    }
}

main().catch(console.error);
