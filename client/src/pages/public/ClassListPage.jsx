import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { classesApi } from "../../api/classesApi.js";
import { queryKeys } from "../../api/queryKeys.js";
import ClassCard from "../../components/class/ClassCard.jsx";
import { useI18n } from "../../i18n/I18nProvider.jsx";

function ClassCardSkeleton() {
    return (
        <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="h-48 animate-pulse bg-surface-container-high" />
            <div className="space-y-lg p-lg">
                <div className="h-6 w-3/4 animate-pulse rounded bg-surface-container-high" />
                <div className="space-y-sm">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-surface-container" />
                    <div className="h-4 w-5/6 animate-pulse rounded bg-surface-container" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-surface-container" />
                </div>
                <div className="space-y-sm pt-sm">
                    <div className="flex justify-between">
                        <div className="h-3 w-16 animate-pulse rounded bg-surface-container" />
                        <div className="h-3 w-24 animate-pulse rounded bg-surface-container" />
                    </div>
                    <div className="h-2 w-full animate-pulse rounded-full bg-surface-container-high" />
                    <div className="h-10 w-full animate-pulse rounded-lg bg-surface-container-high" />
                </div>
            </div>
        </div>
    );
}

function useDebouncedValue(value, delayMs = 350) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setDebouncedValue(value);
        }, delayMs);

        return () => window.clearTimeout(timeoutId);
    }, [value, delayMs]);

    return debouncedValue;
}

export default function ClassListPage() {
    const { t } = useI18n();
    const [searchTerm, setSearchTerm] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [page, setPage] = useState(1);
    const emptyFilters = { level: "", minPrice: "", maxPrice: "", startDateFrom: "", startDateTo: "", coach: "", location: "", sort: "date_asc" };
    const [draftFilters, setDraftFilters] = useState(emptyFilters);
    const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
    const debouncedSearchTerm = useDebouncedValue(searchTerm);
    const navigate = useNavigate();
    const classFilters = Object.fromEntries(Object.entries({ name: debouncedSearchTerm, ...appliedFilters, page, limit: 9 }).filter(([, value]) => value !== ""));
    const activeFilterCount = Object.entries(appliedFilters).filter(([key, value]) => value && !(key === "sort" && value === "date_asc")).length;

    const { data: classesResponse, isLoading, isError } = useQuery({
        queryKey: queryKeys.classes.list(classFilters),
        queryFn: () => classesApi.list(classFilters),
        staleTime: 60_000,
    });

    const classesList = classesResponse?.data?.classes || [];
    const pagination = classesResponse?.data?.pagination || { page: 1, totalPages: 1, total: classesList.length };
    const updateDraft = (event) => setDraftFilters(current => ({ ...current, [event.target.name]: event.target.value }));
    const applyFilters = () => { setAppliedFilters(draftFilters); setPage(1); setIsFilterOpen(false); };
    const clearFilters = () => { setDraftFilters(emptyFilters); setAppliedFilters(emptyFilters); setPage(1); };
    const visiblePages = Array.from({ length: pagination.totalPages }, (_, index) => index + 1).filter(value => value === 1 || value === pagination.totalPages || Math.abs(value - pagination.page) <= 1);

    return (
        <div className="bg-surface bg-white py-xl">
            <div className="max-w-container-max mx-auto p-lg lg:p-xl font-sans">

                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-md mb-xl">
                    <div>
                        <h1 className="text-display-lg font-bold text-on-surface mb-xs">{t("classes.discover")}</h1>
                        <p className="text-body-md text-on-surface-variant">{t("classes.subtitle")}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-sm">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none text-on-surface-variant">
                                <Search size={18} />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                className="block w-full pl-xl pr-md py-sm border border-outline-variant rounded-lg text-body-md bg-surface text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder={t("classes.search")}
                            />
                        </div>

                        <button className={`relative flex items-center justify-center gap-sm rounded-lg border px-md py-sm font-bold ${isFilterOpen || activeFilterCount ? "border-primary text-primary" : "border-outline-variant text-on-surface"}`} onClick={() => setIsFilterOpen(value => !value)} type="button"><SlidersHorizontal size={18} />{t("classes.filters")}{activeFilterCount > 0 && <span className="rounded-full bg-primary px-xs text-label-xs text-white">{activeFilterCount}</span>}</button>
                    </div>
                </div>

                {isFilterOpen && (
                    <section className="mb-xl rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-sm">
                        <div className="mb-md flex items-center justify-between"><h2 className="font-bold text-on-surface">{t("classes.advancedFilters")}</h2><button className="rounded-full p-xs text-on-surface-variant hover:bg-surface-container" onClick={() => setIsFilterOpen(false)} type="button"><X size={20} /></button></div>
                        <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-4">
                            <label className="text-label-sm font-semibold">{t("common.allLevels")}<select className="mt-xs w-full rounded-lg border border-outline-variant bg-white px-md py-sm" name="level" value={draftFilters.level} onChange={updateDraft}><option value="">{t("common.allLevels")}</option><option value="beginner">{t("common.beginner")}</option><option value="intermediate">{t("common.intermediate")}</option><option value="advanced">{t("common.advanced")}</option></select></label>
                            <label className="text-label-sm font-semibold">{t("classes.coach")}<input className="mt-xs w-full rounded-lg border border-outline-variant px-md py-sm" name="coach" value={draftFilters.coach} onChange={updateDraft} placeholder={t("classes.coach")} /></label>
                            <label className="text-label-sm font-semibold">{t("classes.location")}<input className="mt-xs w-full rounded-lg border border-outline-variant px-md py-sm" name="location" value={draftFilters.location} onChange={updateDraft} placeholder={t("classes.location")} /></label>
                            <label className="text-label-sm font-semibold">{t("classes.sort")}<select className="mt-xs w-full rounded-lg border border-outline-variant bg-white px-md py-sm" name="sort" value={draftFilters.sort} onChange={updateDraft}><option value="date_asc">{t("classes.dateSoonest")}</option><option value="date_desc">{t("classes.dateLatest")}</option><option value="price_asc">{t("classes.priceLow")}</option><option value="price_desc">{t("classes.priceHigh")}</option><option value="popularity_desc">{t("classes.popular")}</option><option value="popularity_asc">{t("classes.leastPopular")}</option></select></label>
                            <label className="text-label-sm font-semibold">{t("classes.minPrice")}<input className="mt-xs w-full rounded-lg border border-outline-variant px-md py-sm" min="0" name="minPrice" type="number" value={draftFilters.minPrice} onChange={updateDraft} placeholder="0" /></label>
                            <label className="text-label-sm font-semibold">{t("classes.maxPrice")}<input className="mt-xs w-full rounded-lg border border-outline-variant px-md py-sm" min="0" name="maxPrice" type="number" value={draftFilters.maxPrice} onChange={updateDraft} placeholder="1000000" /></label>
                            <label className="text-label-sm font-semibold">{t("classes.dateFrom")}<input className="mt-xs w-full rounded-lg border border-outline-variant px-md py-sm" name="startDateFrom" type="date" value={draftFilters.startDateFrom} onChange={updateDraft} /></label>
                            <label className="text-label-sm font-semibold">{t("classes.dateTo")}<input className="mt-xs w-full rounded-lg border border-outline-variant px-md py-sm" name="startDateTo" type="date" value={draftFilters.startDateTo} onChange={updateDraft} /></label>
                        </div>
                        <div className="mt-lg flex justify-end gap-sm"><button className="rounded-lg px-md py-sm font-bold text-on-surface-variant" onClick={clearFilters} type="button">{t("classes.clearFilters")}</button><button className="rounded-lg bg-primary px-lg py-sm font-bold text-white" onClick={applyFilters} type="button">{t("classes.applyFilters")}</button></div>
                    </section>
                )}

                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <ClassCardSkeleton key={index} />
                        ))}
                    </div>
                )}
                {isError && <div className="text-center py-xl text-error font-bold">{t("classes.loadError")}</div>}
                {!isLoading && !isError && classesList.length === 0 && <div className="text-center py-xl text-on-surface-variant">{t("classes.empty")}</div>}

                {!isLoading && !isError && classesList.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                        {classesList.map((item) => (
                            <ClassCard key={item._id} item={item} onView={(data) => navigate(`/classes/${data._id}`)} />
                        ))}
                    </div>
                )}

                {!isLoading && !isError && pagination.totalPages > 1 && (
                    <nav className="mt-xl flex flex-wrap items-center justify-center gap-xs" aria-label="Pagination">
                        <button className="rounded-lg border border-outline-variant px-md py-sm font-semibold disabled:opacity-40" disabled={pagination.page <= 1} onClick={() => setPage(value => value - 1)}>{t("classes.previous")}</button>
                        {visiblePages.map((value, index) => <span className="contents" key={value}>{index > 0 && value - visiblePages[index - 1] > 1 && <span className="px-xs">…</span>}<button className={`h-10 min-w-10 rounded-lg px-sm font-bold ${pagination.page === value ? "bg-primary text-white" : "border border-outline-variant"}`} onClick={() => setPage(value)}>{value}</button></span>)}
                        <button className="rounded-lg border border-outline-variant px-md py-sm font-semibold disabled:opacity-40" disabled={pagination.page >= pagination.totalPages} onClick={() => setPage(value => value + 1)}>{t("classes.next")}</button>
                    </nav>
                )}

            </div>
        </div>
    );
}
