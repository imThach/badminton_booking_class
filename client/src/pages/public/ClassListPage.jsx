import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { classApi } from "../../api/classApi.js";
import ClassCard from "../../components/class/classCard.jsx";
import { IoIosSearch } from "react-icons/io";
import { IoIosArrowDown } from "react-icons/io";

export default function ClassListPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [level, setLevel] = useState("");
    const navigate = useNavigate();

    // Gọi API lấy dữ liệu thực tế từ Backend
    const { data: classesResponse, isLoading, isError } = useQuery({
        queryKey: ["classes", searchTerm, level],
        queryFn: () => classApi.getAllClasses({ name: searchTerm, level }),
        staleTime: 5000,
    });

    const classesList = classesResponse?.data?.classes || [];

    return (
        <div className="bg-background py-xl">
            <div className="max-w-container-max mx-auto p-lg lg:p-xl font-sans">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-md mb-xl">
                    <div>
                        <h1 className="text-display-lg font-bold text-on-surface mb-xs">Discover Classes</h1>
                        <p className="text-body-md text-on-surface-variant">Level up your game with professional coaching.</p>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-sm">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none text-on-surface-variant">
                                <IoIosSearch />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-xl pr-md py-sm border border-outline-variant rounded-lg text-body-md bg-surface-bright text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="Search classes..."
                            />
                        </div>

                        <select
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                            className="block w-full sm:w-auto py-sm pl-md border border-outline-variant text-on-surface rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary bg-surface-bright appearance-none cursor-pointer"
                        >
                            <option value="">All Levels</option>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>
                </div>

                {/* Loading / Error States */}
                {isLoading && <div className="flex justify-center py-xl"><span className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent"></span></div>}
                {isError && <div className="text-center py-xl text-error font-bold">Failed to load classes. Please try again later.</div>}
                {!isLoading && !isError && classesList.length === 0 && <div className="text-center py-xl text-on-surface-variant">No classes found matching your criteria.</div>}

                {/* Cards Grid */}
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
