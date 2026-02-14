import { getTranslations } from 'next-intl/server';
import { getPortalUser } from '@/lib/supabase/portal-user';
import { getUserClientId, getUserDivisionId } from '@/lib/services/client';
import { getClientProducts, getClientAvailabilityPlaces } from '@/lib/services/products-service';
import { redirect } from 'next/navigation';
import { Package, MapPin } from 'lucide-react';
import { ProductsPanel } from '@/components/products/ProductsPanel';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Sidebar' });
    return {
        title: `${t('products')} | Tactic Portal`,
    };
}

export default async function ProductsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Sidebar' });
    const isArabic = locale === 'ar';

    const user = await getPortalUser();
    if (!user) {
        redirect(`/${locale}/login`);
    }

    const [clientId, divisionId] = await Promise.all([
        getUserClientId(user.id),
        getUserDivisionId(user.id),
    ]);

    if (!clientId) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{t('products')}</h1>
                        <p className="text-sm text-muted-foreground">
                            {isArabic ? 'كتالوج المنتجات' : 'Product catalog'}
                        </p>
                    </div>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-8 text-center">
                    <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">
                        {isArabic ? 'غير مرتبط بشركة' : 'No Company Association'}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {isArabic
                            ? 'لا يمكن عرض المنتجات بدون ارتباط بشركة'
                            : 'Cannot display products without a company association'}
                    </p>
                </div>
            </div>
        );
    }

    const [productsData, placesData] = await Promise.all([
        getClientProducts(clientId),
        getClientAvailabilityPlaces(clientId),
    ]);

    const { categoryGroups, totalCount, activeCount } = productsData;
    const { places, placeProductMap, chains, chainProductMap } = placesData;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('products')}</h1>
                    <p className="text-sm text-muted-foreground">
                        {isArabic ? 'كتالوج المنتجات' : 'Product catalog'}
                    </p>
                </div>
            </div>

            <ProductsPanel
                categoryGroups={categoryGroups}
                totalCount={totalCount}
                activeCount={activeCount}
                availabilityPlaces={places}
                placeProductMap={placeProductMap}
                chains={chains}
                chainProductMap={chainProductMap}
            />
        </div>
    );
}
