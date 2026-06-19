import { useState, useRef, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Logo from '../common/logo.jsx';
import { IoPerson } from "react-icons/io5";
import Button from '../common/Button';
import { useAuth } from '../../auth/AuthProvider.jsx';

const navLinkClass = ({ isActive }) => isActive
    ? 'text-primary border-b-2 border-primary pb-1 font-bold'
    : 'text-on-surface-variant font-medium hover:text-primary transition-colors';

export default function Header() {
    const { user, logout } = useAuth();
    const isAdmin = user?.role === 'admin';

    // State và Ref cho Dropdown
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Xử lý tự động đóng Dropdown khi click ra ngoài
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
        < header className = "bg-surface bg-white shadow-sm sticky top-0 z-50" >
            <div className="flex justify-between items-center w-full px-lg py-md max-w-container-max mx-auto h-20">

                {/* Logo */}
                <Link to="/" className="hover:opacity-80 transition-opacity">
                    <Logo mobile={true} />
                </Link>

                {/* Navigation Links */}
                <nav className="hidden md:flex items-center gap-xl">
                    <NavLink to="/" className={navLinkClass}>Discover</NavLink>
                    <NavLink to="/user/dashboard" className={navLinkClass}>My Classes</NavLink>
                    {isAdmin && <NavLink to="/admin/classes" className={navLinkClass}>Management</NavLink>}
                </nav>

                {/* User Profile / Login Area */}
                <div className="relative flex items-center" ref={dropdownRef}>
                    {user ? (
                        <>
                            {/* Nút User để mở Dropdown */}
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-sm border border-outline-variant hover:bg-surface-container-low transition-colors rounded-full px-sm py-xs focus:outline-none"
                            >
                                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center">
                                    <IoPerson className="text-on-surface-variant" />
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
                                        <p className="text-label-xs text-outline uppercase tracking-wider mb-1">Account</p>
                                        <p className="text-label-sm font-bold text-on-surface truncate">
                                            {user.email || 'user@example.com'}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            logout();
                                        }}
                                        className="w-full text-left px-md py-sm text-body-md text-error hover:bg-error-container/50 rounded-lg transition-colors font-medium mt-xs"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <Link to="/login">
                            <Button className="px-lg py-sm">Login</Button>
                        </Link>
                    )}
                </div>
            </div>
        </header >
    );
}