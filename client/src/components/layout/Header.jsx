import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Logo from '../common/logo.jsx';
import { User } from "lucide-react";
import Button from '../common/Button.jsx';
import LanguageSwitcher from '../common/LanguageSwitcher.jsx';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { useI18n } from '../../i18n/I18nProvider.jsx';
import ThemeSwitcher from '../common/ThemeSwitcher.jsx';

const navLinkClass = ({ isActive }) => isActive
    ? 'text-primary border-b-2 border-primary pb-1 font-bold'
    : 'text-on-surface-variant font-medium hover:text-primary transition-colors';

const dropdownNavLinkClass = ({ isActive }) =>
    `block rounded-lg px-md py-sm text-body-md font-medium transition-colors ${isActive
        ? 'bg-primary/10 text-primary'
        : 'text-on-surface hover:bg-surface-container-low'
    }`;

export default function Header() {
    const { user, logout } = useAuth();
    const { t } = useI18n();
    const navigate = useNavigate();
    const isAdmin = user?.role === 'admin';

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        < header className="bg-surface bg-white shadow-sm sticky top-0 z-50" >
            <div className="flex justify-between items-center w-full py-md max-w-container-max mx-auto h-20">

                {/* Logo */}
                <Link to="/" className="hover:opacity-80 transition-opacity">
                    <Logo mobile={true} />
                </Link>

                <nav className="hidden lg:flex items-center gap-xl">
                    <NavLink to="/" className={navLinkClass}>{t("nav.discover")}</NavLink>
                    {!isAdmin && <NavLink to="/user/dashboard" className={navLinkClass}>{t("nav.myClasses")}</NavLink>}
                    {!isAdmin && user && <NavLink to="/user/session-transfers" className={navLinkClass}>{t("myClasses.transferTab")}</NavLink>}
                    {isAdmin && <NavLink to="/admin/classes" className={navLinkClass}>{t("nav.management")}</NavLink>}
                    {isAdmin && <NavLink to="/admin/dashboard" className={navLinkClass}>{t("nav.dashboard")}</NavLink>}
                    {isAdmin && <NavLink to="/admin/sessions" className={navLinkClass}>{t("attendance.nav")}</NavLink>}
                    {isAdmin && <NavLink to="/admin/refunds" className={navLinkClass}>{t("nav.refunds")}</NavLink>}
                    {isAdmin && <NavLink to="/admin/audit-logs" className={navLinkClass}>{t("nav.auditLogs")}</NavLink>}
                </nav>

                <div className="relative flex items-center gap-sm" ref={dropdownRef}>
                    <LanguageSwitcher />
                    <ThemeSwitcher />
                    {user ? (
                        <>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-sm border border-outline-variant hover:bg-surface-container-low transition-colors rounded-full px-sm py-xs focus:outline-none"
                            >
                                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center">
                                    <User className="text-on-surface-variant" size={20} />
                                </div>
                                <div className="hidden sm:block text-right pr-xs">
                                    <p className="text-label-sm font-bold text-on-surface">
                                        {user.name || 'User'}
                                    </p>
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            <div
                                className={`absolute top-full right-0 mt-2 w-48 bg-white border border-outline-variant/50 rounded-xl shadow-lg overflow-hidden transition-all duration-200 origin-top-right z-50 ${isDropdownOpen
                                    ? "transform opacity-100 scale-100 visible"
                                    : "transform opacity-0 scale-95 invisible"
                                    }`}
                            >
                                <div className="p-xs">
                                    <div className="px-md py-sm border-b border-outline-variant/30 mb-xs">
                                        <p className="text-label-xs text-outline uppercase tracking-wider mb-1">{t("nav.account")}</p>
                                        <p className="text-label-sm font-bold text-on-surface truncate">
                                            {user.email || 'user@example.com'}
                                        </p>
                                    </div>
                                    <NavLink className={dropdownNavLinkClass} onClick={() => setIsDropdownOpen(false)} to="/user/profile">{t("nav.profile")}</NavLink>
                                    {!isAdmin && <NavLink className={dropdownNavLinkClass} onClick={() => setIsDropdownOpen(false)} to="/user/payments">{t("nav.paymentHistory")}</NavLink>}

                                    <nav className="border-t border-outline-variant/30 pt-xs mt-xs lg:hidden" aria-label="Account navigation">
                                        <NavLink className={dropdownNavLinkClass} onClick={() => setIsDropdownOpen(false)} to="/">{t("nav.discover")}</NavLink>
                                        {!isAdmin && <NavLink className={dropdownNavLinkClass} onClick={() => setIsDropdownOpen(false)} to="/user/dashboard">
                                            {t("nav.myClasses")}
                                        </NavLink>}
                                        {isAdmin && (
                                            <NavLink className={dropdownNavLinkClass} onClick={() => setIsDropdownOpen(false)} to="/admin/classes">
                                                {t("nav.management")}
                                            </NavLink>
                                        )}
                                    {!isAdmin && <NavLink className={dropdownNavLinkClass} onClick={() => setIsDropdownOpen(false)} to="/user/session-transfers">{t("myClasses.transferTab")}</NavLink>}
                                        {isAdmin && <NavLink className={dropdownNavLinkClass} onClick={() => setIsDropdownOpen(false)} to="/admin/dashboard">{t("nav.dashboard")}</NavLink>}
                                        {isAdmin && <NavLink className={dropdownNavLinkClass} onClick={() => setIsDropdownOpen(false)} to="/admin/audit-logs">{t("nav.auditLogs")}</NavLink>}
                                    </nav>

                                    <button
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            logout(undefined, {
                                                onSettled: () => navigate('/login', { replace: true }),
                                            });
                                        }}
                                        className="w-full text-left px-md py-sm text-body-md text-error hover:bg-error-container/50 rounded-lg transition-colors font-medium mt-xs"
                                    >
                                        {t("nav.logout")}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <Link to="/login">
                            <Button className="px-lg py-sm">{t("nav.login")}</Button>
                        </Link>
                    )}
                </div>
            </div>
        </header >
    );
}

