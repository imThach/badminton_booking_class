import { MdOutlineSportsTennis } from "react-icons/md";

export default function Logo({ mobile = false }) {
    return (
        <div className="flex items-center gap-[var(--space-sm)]">
            <MdOutlineSportsTennis
                className={`text-[32px] ${mobile ? "text-[var(--color-primary)]" : "text-white"}`}
            />
            <span className={`text-[20px] font-bold leading-[1.4] tracking-tight ${mobile ? "text-[var(--color-primary)]" : "text-white"}`}>
                SmashCourts
            </span>
        </div>
    );
}