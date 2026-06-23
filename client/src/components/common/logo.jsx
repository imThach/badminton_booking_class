import { Trophy } from "lucide-react";

export default function Logo({ mobile = false }) {
    return (
        <div className="flex items-center gap-[var(--space-sm)]">
            <Trophy
                size={32}
                className={mobile ? "text-[var(--color-primary)]" : "text-white"}
            />
            <span className={`text-[20px] font-bold leading-[1.4] tracking-tight ${mobile ? "text-[var(--color-primary)]" : "text-white"}`}>
                SmashCourts
            </span>
        </div>
    );
}
