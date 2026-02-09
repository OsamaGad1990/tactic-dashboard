// Products Service — Drizzle ORM (Direct PostgreSQL, bypasses RLS)
// Uses: client_products + products + categories
import { db } from '@/lib/db';
import { clientProducts } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { cache } from 'react';

// ── Product Row ──
export interface ProductRow {
    id: string;
    productId: string;
    name: string | null;
    nameAr: string | null;
    categoryId: string | null;
    categoryName: string | null;
    categoryNameAr: string | null;
    imageUrl: string | null;
    barcode: string | null;
    isActive: boolean;
}

// ── Category Group ──
export interface CategoryGroup {
    categoryId: string;
    categoryName: string;
    categoryNameAr: string | null;
    products: ProductRow[];
}

/**
 * Fetch all products for a client, grouped by category
 */
export const getClientProducts = cache(async (clientId: string): Promise<{
    allProducts: ProductRow[];
    categoryGroups: CategoryGroup[];
    totalCount: number;
    activeCount: number;
}> => {
    try {
        // 1. Get all client-product links
        const clientProductRows = await db
            .select({
                id: clientProducts.id,
                clientId: clientProducts.clientId,
                productId: clientProducts.productId,
                isActive: clientProducts.isActive,
            })
            .from(clientProducts)
            .where(eq(clientProducts.clientId, clientId));

        if (clientProductRows.length === 0) {
            return { allProducts: [], categoryGroups: [], totalCount: 0, activeCount: 0 };
        }

        // Use productId FK to look up products
        const productIds = clientProductRows.map(cp => cp.productId);

        // 2. Fetch product details using raw SQL
        // Format as PostgreSQL array literal so it becomes a single $1 param
        const productIdsLiteral = `{${productIds.join(',')}}`;
        const productRows = await db.execute(sql`
            SELECT id, name, name_ar, category_id, image_url, barcode
            FROM products
            WHERE id = ANY(${productIdsLiteral}::uuid[])
        `) as unknown as {
            id: string;
            name: string | null;
            name_ar: string | null;
            category_id: string | null;
            image_url: string | null;
            barcode: string | null;
        }[];

        // 3. Collect category IDs and fetch category names
        const categoryIds = [...new Set(
            productRows.map(p => p.category_id).filter(Boolean) as string[]
        )];

        const categoryMap = new Map<string, { name: string | null; nameAr: string | null }>();
        if (categoryIds.length > 0) {
            const categoryIdsLiteral = `{${categoryIds.join(',')}}`;
            const categoryRows = await db.execute(sql`
                SELECT id, name, name_ar
                FROM categories
                WHERE id = ANY(${categoryIdsLiteral}::uuid[])
            `) as unknown as {
                id: string;
                name: string | null;
                name_ar: string | null;
            }[];

            for (const cat of categoryRows) {
                categoryMap.set(cat.id, { name: cat.name, nameAr: cat.name_ar });
            }
        }

        // 4. Build the activity map from clientProducts
        const activityMap = new Map<string, boolean>();
        for (const cp of clientProductRows) {
            activityMap.set(cp.productId, cp.isActive ?? true);
        }

        // 5. Build ProductRow array
        const allProducts: ProductRow[] = productRows.map(p => {
            const cat = p.category_id ? categoryMap.get(p.category_id) : null;
            return {
                id: p.id,
                productId: p.id,
                name: p.name,
                nameAr: p.name_ar,
                categoryId: p.category_id,
                categoryName: cat?.name ?? null,
                categoryNameAr: cat?.nameAr ?? null,
                imageUrl: p.image_url,
                barcode: p.barcode,
                isActive: activityMap.get(p.id) ?? true,
            };
        });

        // 6. Group by category
        const groupMap = new Map<string, ProductRow[]>();
        const uncategorized: ProductRow[] = [];

        for (const product of allProducts) {
            if (product.categoryId) {
                const existing = groupMap.get(product.categoryId) ?? [];
                existing.push(product);
                groupMap.set(product.categoryId, existing);
            } else {
                uncategorized.push(product);
            }
        }

        const categoryGroups: CategoryGroup[] = [];
        for (const [catId, prods] of groupMap) {
            const cat = categoryMap.get(catId);
            categoryGroups.push({
                categoryId: catId,
                categoryName: cat?.name ?? 'Unknown',
                categoryNameAr: cat?.nameAr ?? null,
                products: prods,
            });
        }

        if (uncategorized.length > 0) {
            categoryGroups.push({
                categoryId: 'uncategorized',
                categoryName: 'Uncategorized',
                categoryNameAr: 'بدون تصنيف',
                products: uncategorized,
            });
        }

        // Sort groups by name
        categoryGroups.sort((a, b) => (a.categoryName ?? '').localeCompare(b.categoryName ?? ''));

        const activeCount = allProducts.filter(p => p.isActive).length;

        return {
            allProducts,
            categoryGroups,
            totalCount: allProducts.length,
            activeCount,
        };
    } catch (error) {
        console.error('Products service error:', error);
        return { allProducts: [], categoryGroups: [], totalCount: 0, activeCount: 0 };
    }
});
