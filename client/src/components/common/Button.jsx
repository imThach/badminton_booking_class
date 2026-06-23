export default function Button({
    children,
    className = "",
    type = "button",
    variant = "primary",
    ...props
}) {
    const variants = {
        primary: "bg-primary text-on-primary hover:bg-primary-container",
        ghost: "bg-transparent text-on-surface-variant hover:bg-surface-container",
        secondary: "bg-surface-container text-on-surface hover:bg-surface-container-high",
        danger: "bg-error text-on-error hover:bg-error-container hover:text-on-error-container",
    };

    return (
        <button
            className={`inline-flex min-h-10 items-center justify-center gap-sm rounded-lg font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${variants[variant] || variants.primary} ${className}`}
            type={type}
            {...props}
        >
            {children}
        </button>
    );
}
