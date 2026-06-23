import { Clock, MapPin, User } from "lucide-react";

export default function ClassCard({ item, onView, actionSlot }) {
    // Map dữ liệu từ Backend API (hoặc mock data)
    const title = item.title || item.name;
    const coach = item.coachName || item.coach;
    const enrolled = item.currentStudents || item.enrolled || 0;
    const capacity = item.maxStudents || item.maxCapacity || item.capacity || 0;

    // Tính phần trăm thanh progress
    const progressPercentage = capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0;
    // Kiểm tra lớp đã đầy chưa
    const isFull = enrolled >= capacity;

    // Placeholder image nếu Backend chưa trả về ảnh
    const imageUrl = item.image || item.imageUrl || "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?q=80&w=600&auto=format&fit=crop";

    return (
        <div className="flex flex-col bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Image & Badge */}
            <div className="relative h-48 w-full group overflow-hidden">
                <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-primary text-on-primary text-[10px] font-bold px-3 py-1 rounded-sm uppercase tracking-wider shadow-sm">
                    {item.level || "ALL LEVELS"}
                </div>
            </div>

            {/* Content */}
            <div className="p-lg flex flex-col flex-grow">
                <h3 className="text-title-md font-bold text-on-surface mb-md line-clamp-1">{title}</h3>

                {/* Info List */}
                <div className="space-y-sm mb-lg text-label-sm text-on-surface-variant">
                    <div className="flex items-center gap-sm"><User size={18} className="opacity-75" /><span>{coach}</span></div>
                    <div className="flex items-center gap-sm"><Clock size={18} className="opacity-75" /><span>{item.schedule}</span></div>
                    <div className="flex items-center gap-sm"><MapPin size={18} className="opacity-75" /><span>{item.location}</span></div>
                </div>

                {/* Capacity & Action */}
                <div className="mt-auto pt-sm">
                    <div className="flex justify-between items-center text-label-xs mb-xs">
                        <span className="font-semibold text-on-surface-variant">Capacity</span>
                        <span className="font-bold text-primary">{enrolled}/{capacity} Enrolled</span>
                    </div>

                    <div className="w-full bg-surface-container-high rounded-full h-2 mb-lg overflow-hidden">
                        <div className={`${isFull ? 'bg-error' : 'bg-primary'} h-full rounded-full transition-all duration-500`} style={{ width: `${progressPercentage}%` }}></div>
                    </div>

                    {actionSlot || (
                        <button
                            onClick={() => onView && onView(item)}
                            className={`w-full py-2.5 px-4 rounded-lg font-bold text-label-sm transition-colors ${isFull ? "border-2 border-primary text-primary bg-transparent hover:bg-primary-container/20" : "bg-primary text-white hover:bg-primary-container active:scale-[0.98]"}`}
                        >
                            View Details
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
