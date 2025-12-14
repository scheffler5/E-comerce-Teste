'use client';

import { useState, useRef, useEffect } from 'react';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function SellerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('loja-user');
        localStorage.removeItem('loja-token');
        router.push('/login');
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Semantic Header for Sellers */}
            <header className="border-b border-gray-200 bg-white relative z-50">
                <div className="container mx-auto px-4 h-20 flex items-center justify-between">

                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="flex flex-col items-center">
                            <Image
                                src="/image.png"
                                alt="Logo"
                                width={40}
                                height={40}
                                className="object-contain"
                            />
                            <span className="text-[10px] font-bold text-red-600 leading-none">E-COMMERCE</span>
                        </div>
                    </Link>

                    {/* Nav Links - Center */}
                    <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-gray-700">
                        <Link href="/dashboard/products" className="hover:text-red-600 transition">Gerenciar Produtos</Link>
                        <Link href="/dashboard/import" className="hover:text-red-600 transition">Importar CSV</Link>
                        <span className="text-gray-400 cursor-not-allowed">Trending Tops</span>
                    </nav>

                    {/* Account - Right (Dropdown) */}
                    <div className="flex items-center gap-4 relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 font-medium hover:text-red-600 transition group"
                        >
                            <span className="bg-gray-100 p-2 rounded-full group-hover:bg-red-50 transition">
                                <User size={20} className="text-gray-600 group-hover:text-red-600" />
                            </span>
                            <span>Conta</span>
                            <ChevronDown size={16} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-sm shadow-lg py-2 animate-in fade-in zoom-in-95 duration-200">
                                <Link
                                    href="/dashboard/profile"
                                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 flex items-center gap-2 w-full text-left"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    <User size={16} />
                                    Editar Perfil
                                </Link>
                                <div className="border-t border-gray-100 my-1"></div>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 w-full text-left font-medium"
                                >
                                    <LogOut size={16} />
                                    Sair
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </header>

            <main className="flex-1 bg-gray-50">
                {children}
            </main>

            <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
                <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
                    @Copyright
                </div>
            </footer>
        </div>
    );
}
