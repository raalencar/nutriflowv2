import { db } from '../db';
import { products } from '../db/schema';
import fs from 'fs';
import path from 'path';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Helper to generate SKU
function generateSKU(name: string): string {
    const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${random}`;
}

async function importProducts() {
    console.log('📦 Starting product import...');

    // Path to CSV in project root (server is in /server, file is in /)
    const csvPath = path.resolve(__dirname, '../../insumos.csv'); // script runs from server root via tsx usually, but let's assume valid path resolution

    // Check if file exists
    if (!fs.existsSync(csvPath)) {
        console.error(`❌ File not found at: ${csvPath}`);
        process.exit(1);
    }

    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n');

    // Skip Header (Categoria,Produto,Unidade de Medida)
    const dataLines = lines.slice(1).filter(l => l.trim().length > 0);

    let count = 0;
    let skipped = 0;

    for (const line of dataLines) {
        const parts = line.split(',');
        // Handle potential commas in fields? Assuming simple CSV for now based on snippet
        if (parts.length < 3) continue;

        const category = parts[0].trim();
        const name = parts[1].trim();
        const unit = parts[2].trim();

        if (!name || !unit) {
            console.log(`Skipping invalid line: ${line}`);
            continue;
        }

        // Check if product exists by Name to avoid duplicates (since SKU is generated)
        const existing = await db.select().from(products).where(eq(products.name, name)).limit(1);

        if (existing.length > 0) {
            console.log(`⚠️  Product already exists: ${name}`);
            skipped++;
            continue;
        }

        const sku = generateSKU(name);

        await db.insert(products).values({
            sku,
            name,
            unit,
            category,
            purchaseType: 'local', // Default
            price: '0.00',        // Default
            status: 'active'
        });

        count++;
        // console.log(`✅ Added: ${name} (${sku})`);
    }

    console.log(`\n🎉 Import completed!`);
    console.log(`Total Added: ${count}`);
    console.log(`Skipped (Exists): ${skipped}`);

    process.exit(0);
}

importProducts().catch((err) => {
    console.error(err);
    process.exit(1);
});
