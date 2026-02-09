'use client';

import type { CategoryGroup, ProductRow } from '@/lib/services/products-service';
import { cn } from '@/lib/utils';
import {
    ChevronDown,
    ChevronRight,
    Inbox,
    Package,
    Search,
    Tag,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { useMemo, useState } from 'react';

interface ProductsPanelProps {
    categoryGroups: CategoryGroup[];
    totalCount: number;
    activeCount: number;
}

export function ProductsPanel({ categoryGroups, totalCount, activeCount }: ProductsPanelProps) {
    const locale = useLocale();
    const isArabic = locale === 'ar';
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    // Filter
    const filteredGroups = useMemo(() => {
        if (!searchTerm.trim()) return categoryGroups;

        const term = searchTerm.toLowerCase();
        return categoryGroups
            .map(group => ({
                ...group,
                products: group.products.filter(p =>
                    (p.name?.toLowerCase().includes(term)) ||
                    (p.nameAr?.includes(term)) ||
                    (p.barcode?.toLowerCase().includes(term))
                ),
            }))
            .filter(group => group.products.length > 0);
    }, [categoryGroups, searchTerm]);

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
                                                <ProductCard key={product.id} product={product} isArabic={isArabic} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── Product Card ──
function ProductCard({ product, isArabic }: { product: ProductRow; isArabic: boolean }) {
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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50 overflow-hidden">
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={displayName}
                        className="h-full w-full object-cover"
                    />
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
