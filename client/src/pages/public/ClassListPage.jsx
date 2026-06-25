import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Search } from "lucide-react";
import { classesApi } from "../../api/classesApi.js";
import { queryKeys } from "../../api/queryKeys.js";
import ClassCard from "../../components/class/ClassCard.jsx";

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
    const [searchTerm, setSearchTerm] = useState("");
    const [level, setLevel] = useState("");
    const debouncedSearchTerm = useDebouncedValue(searchTerm);
    const navigate = useNavigate();
    const classFilters = { name: debouncedSearchTerm, level };

    const { data: classesResponse, isLoading, isError } = useQuery({
        queryKey: queryKeys.classes.list(classFilters),
        queryFn: () => classesApi.list(classFilters),
        staleTime: 5000,
    });

    const classesList = classesResponse?.data?.classes || [];

    return (
        <div className="bg-surface bg-white py-xl">
            <div className="max-w-container-max mx-auto p-lg lg:p-xl font-sans">

                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-md mb-xl">
                    <div>
                        <h1 className="text-display-lg font-bold text-on-surface mb-xs">Discover Classes</h1>
                        <p className="text-body-md text-on-surface-variant">Level up your game with professional coaching.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-sm">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none text-on-surface-variant">
                                <Search size={18} />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-xl pr-md py-sm border border-outline-variant rounded-lg text-body-md bg-surface text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="Search classes..."
                            />
                        </div>

                        <div className="relative w-full sm:w-auto">
                            <select
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                                className="block w-full py-sm pl-md pr-10 border border-outline-variant text-on-surface rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary bg-surface appearance-none cursor-pointer"
                            >
                                <option value="">All Levels</option>
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>

                            <div className="absolute inset-y-0 right-0 flex items-center pr-md pointer-events-none">
                                <ChevronDown className="text-on-surface-variant" size={18} />
                            </div>
                        </div>
                    </div>
                </div>

                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <ClassCardSkeleton key={index} />
                        ))}
                    </div>
                )}
                {isError && <div className="text-center py-xl text-error font-bold">Failed to load classes. Please try again later.</div>}
                {!isLoading && !isError && classesList.length === 0 && <div className="text-center py-xl text-on-surface-variant">No classes found matching your criteria.</div>}

                {!isLoading && !isError && classesList.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                        {classesList.map((item) => (
                            <ClassCard key={item._id} item={item} onView={(data) => navigate(`/classes/${data._id}`)} />
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}
