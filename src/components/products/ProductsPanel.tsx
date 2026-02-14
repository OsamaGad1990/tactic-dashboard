'use client';

import type { AvailabilityPlace, CategoryGroup, ChainItem, ProductRow } from '@/lib/services/products-service';
import { cn } from '@/lib/utils';
import {
    ChevronDown,
    ChevronRight,
    Inbox,
    Layers,
    LayoutGrid,
    MapPin,
    Package,
    Search,
    ShoppingCart,
    Tag,
    X,
    ZoomIn,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface ProductsPanelProps {
    categoryGroups: CategoryGroup[];
    totalCount: number;
    activeCount: number;
    availabilityPlaces: AvailabilityPlace[];
    placeProductMap: Record<string, string[]>;
    chains: ChainItem[];
    chainProductMap: Record<string, string[]>;
}

// Map place codes to icons for visual variety
const PLACE_ICONS: Record<string, React.ElementType> = {
    chains: ShoppingCart,
    gondola: Layers,
    floor_display: LayoutGrid,
};

function getPlaceIcon(code: string | null): React.ElementType {
    if (!code) return MapPin;
    return PLACE_ICONS[code.toLowerCase()] ?? MapPin;
}

export function ProductsPanel({
    categoryGroups,
    totalCount,
    activeCount,
    availabilityPlaces,
    placeProductMap,
    chains,
    chainProductMap,
}: ProductsPanelProps) {
    const locale = useLocale();
    const isArabic = locale === 'ar';
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [lightboxProduct, setLightboxProduct] = useState<ProductRow | null>(null);
    const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
    const [selectedChainId, setSelectedChainId] = useState<string | null>(null);

    // Close lightbox on Escape
    const closeLightbox = useCallback(() => setLightboxProduct(null), []);
    useEffect(() => {
        if (!lightboxProduct) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeLightbox();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [lightboxProduct, closeLightbox]);

    // Filter by search + availability place + chain
    const filteredGroups = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        const placeAllowed = selectedPlaceId
            ? new Set(placeProductMap[selectedPlaceId] ?? [])
            : null;
        const chainAllowed = selectedChainId
            ? new Set(chainProductMap[selectedChainId] ?? [])
            : null;

        return categoryGroups
            .map(group => ({
                ...group,
                products: group.products.filter(p => {
                    // Place filter
                    if (placeAllowed && !placeAllowed.has(p.productId)) return false;
                    // Chain filter
                    if (chainAllowed && !chainAllowed.has(p.productId)) return false;
                    // Search filter
                    if (term) {
                        return (
                            p.name?.toLowerCase().includes(term) ||
                            p.nameAr?.includes(term) ||
                            p.barcode?.toLowerCase().includes(term)
                        );
                    }
                    return true;
                }),
            }))
            .filter(group => group.products.length > 0);
    }, [categoryGroups, searchTerm, selectedPlaceId, placeProductMap, selectedChainId, chainProductMap]);

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }
            return next;
        });
    };

    const expandAll = () => {
        setExpandedCategories(new Set(filteredGroups.map(g => g.categoryId)));
    };

    const collapseAll = () => {
        setExpandedCategories(new Set());
    };

    return (
        <div className="space-y-5">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatCard
                    icon={<Package className="h-4 w-4" />}
                    label={isArabic ? 'إجمالي المنتجات' : 'Total Products'}
                    value={totalCount.toString()}
                />
                <StatCard
                    icon={<Tag className="h-4 w-4" />}
                    label={isArabic ? 'المنتجات النشطة' : 'Active Products'}
                    value={activeCount.toString()}
                    highlight="green"
                />
                <StatCard
                    icon={<Package className="h-4 w-4" />}
                    label={isArabic ? 'التصنيفات' : 'Categories'}
                    value={categoryGroups.length.toString()}
                />
            </div>

            {/* Search + Controls */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={isArabic ? 'بحث عن منتج...' : 'Search products...'}
                        className="w-full rounded-lg border border-border/60 bg-background/50 ps-9 pe-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                    />
                </div>

                {/* Chains Dropdown */}
                {chains.length > 0 && (
                    <div className="relative min-w-[180px]">
                        <ShoppingCart className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <select
                            value={selectedChainId ?? ''}
                            onChange={(e) => setSelectedChainId(e.target.value || null)}
                            className="w-full appearance-none rounded-lg border border-border/60 bg-background/50 ps-9 pe-8 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 cursor-pointer"
                        >
                            <option value="">
                                {isArabic ? 'كل السلاسل' : 'All Chains'}
                            </option>
                            {chains.map((chain) => {
                                const chainName = isArabic
                                    ? (chain.nameAr || chain.nameEn || chain.code || '—')
                                    : (chain.nameEn || chain.code || '—');
                                const count = (chainProductMap[chain.id] ?? []).length;
                                return (
                                    <option key={chain.id} value={chain.id}>
                                        {chainName} ({count})
                                    </option>
                                );
                            })}
                        </select>
                        <ChevronDown className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                )}

                {/* Availability Places Dropdown */}
                {availabilityPlaces.length > 0 && (
                    <div className="relative min-w-[180px]">
                        <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <select
                            value={selectedPlaceId ?? ''}
                            onChange={(e) => setSelectedPlaceId(e.target.value || null)}
                            className="w-full appearance-none rounded-lg border border-border/60 bg-background/50 ps-9 pe-8 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 cursor-pointer"
                        >
                            <option value="">
                                {isArabic ? 'كل أماكن العرض' : 'All Locations'}
                            </option>
                            {availabilityPlaces.map((place) => {
                                const placeName = isArabic
                                    ? (place.nameAr || place.nameEn || place.code || '—')
                                    : (place.nameEn || place.code || '—');
                                const count = (placeProductMap[place.id] ?? []).length;
                                return (
                                    <option key={place.id} value={place.id}>
                                        {placeName} ({count})
                                    </option>
                                );
                            })}
                        </select>
                        <ChevronDown className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={expandAll}
                        className="rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                    >
                        {isArabic ? 'توسيع الكل' : 'Expand All'}
                    </button>
                    <button
                        onClick={collapseAll}
                        className="rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                    >
                        {isArabic ? 'طي الكل' : 'Collapse All'}
                    </button>
                </div>
            </div>

            {/* Category Groups */}
            {filteredGroups.length === 0 ? (
                <div className="rounded-xl border border-border/60 bg-card p-12 text-center">
                    <Inbox className="mx-auto h-12 w-12 text-muted-foreground/40" />
                    <p className="mt-4 text-sm text-muted-foreground">
                        {searchTerm
                            ? (isArabic ? 'لا توجد نتائج' : 'No results found')
                            : (isArabic ? 'لا توجد منتجات' : 'No products found')}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredGroups.map((group) => {
                        const isExpanded = expandedCategories.has(group.categoryId);
                        const categoryLabel = isArabic
                            ? (group.categoryNameAr || group.categoryName)
                            : group.categoryName;

                        return (
                            <div key={group.categoryId} className="rounded-xl border border-border/60 bg-card overflow-hidden">
                                {/* Category Header */}
                                <button
                                    onClick={() => toggleCategory(group.categoryId)}
                                    className="flex w-full items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
                                >
                                    {isExpanded
                                        ? <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
                                        : <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform" />
                                    }
                                    <Tag className="h-4 w-4 text-primary/70" />
                                    <span className="font-semibold text-sm">{categoryLabel}</span>
                                    <span className="ms-auto rounded-full bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                        {group.products.length} {isArabic ? 'منتج' : 'products'}
                                    </span>
                                </button>

                                {/* Products Grid */}
                                {isExpanded && (
                                    <div className="border-t border-border/40 px-4 py-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                            {group.products.map((product) => (
                                                <ProductCard
                                                    key={product.id}
                                                    product={product}
                                                    isArabic={isArabic}
                                                    onImageClick={() => product.imageUrl && setLightboxProduct(product)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Lightbox Modal ── */}
            {lightboxProduct && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={closeLightbox}
                >
                    <div
                        className="relative max-w-lg w-[90vw] rounded-2xl border border-border/30 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={closeLightbox}
                            className="absolute top-3 end-3 z-10 rounded-full bg-black/50 p-1.5 text-white/80 hover:text-white hover:bg-black/70 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Image */}
                        <div className="relative w-full aspect-square bg-muted/30 flex items-center justify-center">
                            <img
                                src={lightboxProduct.imageUrl!}
                                alt={isArabic ? (lightboxProduct.nameAr || lightboxProduct.name || '') : (lightboxProduct.name || '')}
                                className="max-h-full max-w-full object-contain p-4"
                            />
                        </div>

                        {/* Product Info */}
                        <div className="px-5 py-4 border-t border-border/30">
                            <p className="font-semibold text-base">
                                {isArabic
                                    ? (lightboxProduct.nameAr || lightboxProduct.name || '—')
                                    : (lightboxProduct.name || '—')}
                            </p>
                            {lightboxProduct.barcode && (
                                <p className="text-xs text-muted-foreground mt-1">{lightboxProduct.barcode}</p>
                            )}
                            {lightboxProduct.categoryName && (
                                <p className="text-xs text-primary/70 mt-1">
                                    {isArabic
                                        ? (lightboxProduct.categoryNameAr || lightboxProduct.categoryName)
                                        : lightboxProduct.categoryName}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Product Card ──
function ProductCard({
    product,
    isArabic,
    onImageClick,
}: {
    product: ProductRow;
    isArabic: boolean;
    onImageClick: () => void;
}) {
    const displayName = isArabic
        ? (product.nameAr || product.name || '—')
        : (product.name || '—');

    return (
        <div className={cn(
            'flex items-center gap-3 rounded-lg border p-3 transition-all duration-150',
            product.isActive
                ? 'border-border/40 bg-background/50 hover:border-primary/30 hover:shadow-sm'
                : 'border-border/20 bg-muted/20 opacity-60',
        )}>
            {/* Image */}
            <div
                className={cn(
                    'group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50 overflow-hidden',
                    product.imageUrl && 'cursor-pointer',
                )}
                onClick={product.imageUrl ? onImageClick : undefined}
            >
                {product.imageUrl ? (
                    <>
                        <img
                            src={product.imageUrl}
                            alt={displayName}
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-110"
                        />
                        {/* Zoom overlay on hover */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <ZoomIn className="h-4 w-4 text-white" />
                        </div>
                    </>
                ) : (
                    <Package className="h-5 w-5 text-muted-foreground/50" />
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
                {product.barcode && (
                    <p className="text-[11px] text-muted-foreground truncate">{product.barcode}</p>
                )}
            </div>

            {/* Active Badge */}
            {!product.isActive && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {isArabic ? 'غير نشط' : 'Inactive'}
                </span>
            )}
        </div>
    );
}

// ── Stat Card ──
function StatCard({
    icon,
    label,
    value,
    highlight,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    highlight?: 'green' | 'amber' | 'red';
}) {
    const valueColor = highlight === 'green'
        ? 'text-emerald-600 dark:text-emerald-400'
        : highlight === 'amber'
            ? 'text-amber-600 dark:text-amber-400'
            : highlight === 'red'
                ? 'text-red-600 dark:text-red-400'
                : 'text-foreground';

    return (
        <div className="rounded-xl border border-border/40 bg-card/50 p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
                {icon}
                <span className="text-[11px] font-medium">{label}</span>
            </div>
            <p className={cn('text-2xl font-bold', valueColor)}>{value}</p>
        </div>
    );
}
