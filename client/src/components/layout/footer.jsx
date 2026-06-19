export default function Footer() {
    return (
        <footer className="bg-surface-container-highest border-t border-outline-variant mt-xl">
            <div className="w-full py-xl px-lg flex flex-col md:flex-row justify-between items-center max-w-container-max mx-auto gap-lg">
                <div className="flex flex-col items-center md:items-start gap-sm">
                    <span className="text-title-md font-bold text-primary">SmashCourts</span>
                    <p className="text-label-sm text-on-surface-variant text-center md:text-left">© 2026 SmashCourts Booking System. All rights reserved.</p>
                </div>
                <div className="flex gap-xl"><a className="text-label-sm text-on-surface-variant hover:text-primary" href="#">Privacy Policy</a><a className="text-label-sm text-on-surface-variant hover:text-primary" href="#">Terms</a><a className="text-label-sm text-on-surface-variant hover:text-primary" href="#">Support</a></div>
            </div>
        </footer>
    );
}
