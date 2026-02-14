// Products Service — Supabase Server Client (respects RLS via user session)
// Uses: client_products + products + categories
import { createClient } from '@/lib/supabase/server';
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
        const supabase = await createClient();

        // 1. Get all client-product links
        const { data: clientProductRows, error: cpError } = await supabase
            .from('client_products')
            .select('id, client_id, product_id, is_active')
            .eq('client_id', clientId);

        if (cpError) {
            console.error('Failed to fetch client_products:', cpError.message);
            return { allProducts: [], categoryGroups: [], totalCount: 0, activeCount: 0 };
        }

        if (!clientProductRows || clientProductRows.length === 0) {
            return { allProducts: [], categoryGroups: [], totalCount: 0, activeCount: 0 };
        }

        // 2. Fetch product details (actual column names from DB)
        const productIds = clientProductRows.map(cp => cp.product_id);
        const { data: productRows, error: pError } = await supabase
            .from('products')
            .select('id, name_en, name_ar, category_id, photo_path, global_sku_code')
            .in('id', productIds);

        if (pError) {
            console.error('Failed to fetch products:', pError.message);
            return { allProducts: [], categoryGroups: [], totalCount: 0, activeCount: 0 };
        }

        if (!productRows || productRows.length === 0) {
            return { allProducts: [], categoryGroups: [], totalCount: 0, activeCount: 0 };
        }

        // 2b. Generate signed URLs for product photos (bucket has RLS)
        const PRODUCT_PHOTOS_BUCKET = 'products-photos';
        const SIGNED_URL_EXPIRY = 3600; // 1 hour
        const photoMap = new Map<string, string>();

        const productsWithPhotos = productRows.filter(p => p.photo_path);
        if (productsWithPhotos.length > 0) {
            const signResults = await Promise.allSettled(
                productsWithPhotos.map(async (p) => {
                    const { data, error } = await supabase.storage
                        .from(PRODUCT_PHOTOS_BUCKET)
                        .createSignedUrl(p.photo_path!, SIGNED_URL_EXPIRY);

                    if (error || !data?.signedUrl) {
                        console.warn('⚠️ Signed URL failed:', p.photo_path, error?.message);
                        return { id: p.id, url: null };
                    }
                    return { id: p.id, url: data.signedUrl };
                })
            );

            for (const result of signResults) {
                if (result.status === 'fulfilled' && result.value.url) {
                    photoMap.set(result.value.id, result.value.url);
                }
            }
        }

        // 3. Collect category IDs and fetch category names
        const categoryIds = [...new Set(
            productRows.map(p => p.category_id).filter(Boolean) as string[]
        )];

        const categoryMap = new Map<string, { name: string | null; nameAr: string | null }>();
        if (categoryIds.length > 0) {
            const { data: categoryRows } = await supabase
                .from('categories')
                .select('id, name_en, name_ar')
                .in('id', categoryIds);

            if (categoryRows) {
                for (const cat of categoryRows) {
                    categoryMap.set(cat.id, { name: cat.name_en, nameAr: cat.name_ar });
                }
            }
        }

        // 4. Build the activity map from clientProducts
        const activityMap = new Map<string, boolean>();
        for (const cp of clientProductRows) {
            activityMap.set(cp.product_id, cp.is_active ?? true);
        }

        // 5. Build ProductRow array (map DB columns → interface fields)
        const allProducts: ProductRow[] = productRows.map(p => {
            const cat = p.category_id ? categoryMap.get(p.category_id) : null;
            return {
                id: p.id,
                productId: p.id,
                name: p.name_en,
                nameAr: p.name_ar,
                categoryId: p.category_id,
                categoryName: cat?.name ?? null,
                categoryNameAr: cat?.nameAr ?? null,
                imageUrl: photoMap.get(p.id) || null,
                barcode: p.global_sku_code,
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

// ── Availability Place ──
export interface AvailabilityPlace {
    id: string;
    code: string | null;
    nameEn: string | null;
    nameAr: string | null;
}

// ── Chain ──
export interface ChainItem {
    id: string;
    code: string | null;
    nameEn: string | null;
    nameAr: string | null;
}

/**
 * Fetch availability places, chains, and their product mappings for a client
 */
export const getClientAvailabilityPlaces = cache(async (clientId: string): Promise<{
    places: AvailabilityPlace[];
    placeProductMap: Record<string, string[]>;
    chains: ChainItem[];
    chainProductMap: Record<string, string[]>;
}> => {
    const empty = { places: [], placeProductMap: {}, chains: [], chainProductMap: {} };
    try {
        const supabase = await createClient();

        // 1. Get all links for this client (chain_id + place_id + product_id)
        const { data: links, error } = await supabase
            .from('availability_place_products_v2')
            .select('chain_id, place_id, product_id')
            .eq('client_id', clientId);

        if (error || !links || links.length === 0) {
            return empty;
        }

        // 2. Build separate maps
        const placeProductMap: Record<string, string[]> = {};
        const chainProductMap: Record<string, string[]> = {};
        const placeIds = new Set<string>();
        const chainIds = new Set<string>();

        for (const link of links) {
            // Place map
            if (link.place_id) {
                placeIds.add(link.place_id);
                if (!placeProductMap[link.place_id]) placeProductMap[link.place_id] = [];
                placeProductMap[link.place_id].push(link.product_id);
            }
            // Chain map
            if (link.chain_id) {
                chainIds.add(link.chain_id);
                if (!chainProductMap[link.chain_id]) chainProductMap[link.chain_id] = [];
                chainProductMap[link.chain_id].push(link.product_id);
            }
        }

        // 3. Fetch place details
        let places: AvailabilityPlace[] = [];
        if (placeIds.size > 0) {
            const { data: placeRows } = await supabase
                .from('availability_places')
                .select('id, code, name_en, name_ar')
                .in('id', [...placeIds]);

            if (placeRows) {
                places = placeRows.map(p => ({
                    id: p.id,
                    code: p.code,
                    nameEn: p.name_en,
                    nameAr: p.name_ar,
                }));
                places.sort((a, b) => (a.nameEn ?? '').localeCompare(b.nameEn ?? ''));
            }
        }

        // 4. Fetch chain details
        let chains: ChainItem[] = [];
        if (chainIds.size > 0) {
            const { data: chainRows } = await supabase
                .from('chains')
                .select('id, code, name_en, name_ar')
                .in('id', [...chainIds]);

            if (chainRows) {
                chains = chainRows.map(c => ({
                    id: c.id,
                    code: c.code,
                    nameEn: c.name_en,
                    nameAr: c.name_ar,
                }));
                chains.sort((a, b) => (a.nameEn ?? '').localeCompare(b.nameEn ?? ''));
            }
        }

        return { places, placeProductMap, chains, chainProductMap };
    } catch (error) {
        console.error('Availability places service error:', error);
        return empty;
    }
});
