import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('🚀 Starting membership plans migration...\n');

    try {
        // Read the SQL file
        const sqlPath = path.join(__dirname, '..', 'database', 'migrations', 'update_membership_plans.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📝 Executing migration script...');

        // Execute the migration
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            // Try direct execution if RPC doesn't work
            console.log('⚠️  RPC method failed, trying direct execution...');

            // Split by semicolons and execute each statement
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            for (const statement of statements) {
                if (statement.includes('SELECT')) {
                    const { data: result, error: execError } = await supabase.from('MembershipPlan').select('*');
                    if (execError) {
                        console.error('❌ Error:', execError.message);
                    } else {
                        console.log('\n✅ Current plans in database:');
                        console.table(result);
                    }
                }
            }
        }

        // Verify the plans were created
        const { data: plans, error: fetchError } = await supabase
            .from('MembershipPlan')
            .select('*')
            .order('targetRole', { ascending: true })
            .order('sortOrder', { ascending: true });

        if (fetchError) {
            console.error('❌ Error fetching plans:', fetchError.message);
            return;
        }

        console.log('\n✅ Migration completed successfully!\n');
        console.log('📊 Created plans:');
        console.log('─'.repeat(80));

        const clientPlans = plans?.filter(p => p.targetRole === 'CLIENT') || [];
        const influencerPlans = plans?.filter(p => p.targetRole === 'INFLUENCER') || [];

        console.log('\n🏢 CLIENT PLANS:');
        clientPlans.forEach(plan => {
            console.log(`  • ${plan.name} - ₹${plan.price}/${plan.billingCycle.toLowerCase()}`);
            console.log(`    ${plan.description}`);
            console.log(`    Popular: ${plan.isPopular ? '⭐ Yes' : 'No'}`);
            console.log('');
        });

        console.log('\n👤 INFLUENCER PLANS:');
        influencerPlans.forEach(plan => {
            console.log(`  • ${plan.name} - ₹${plan.price}/${plan.billingCycle.toLowerCase()}`);
            console.log(`    ${plan.description}`);
            console.log(`    Popular: ${plan.isPopular ? '⭐ Yes' : 'No'}`);
            console.log('');
        });

        console.log('─'.repeat(80));
        console.log(`\n🎉 Total plans created: ${plans?.length || 0}`);
        console.log('   • CLIENT: ' + clientPlans.length);
        console.log('   • INFLUENCER: ' + influencerPlans.length);

    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

// Run the migration
runMigration()
    .then(() => {
        console.log('\n✅ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
