'use client';

import Link from 'next/link';
import { Search, ShoppingCart, Heart, User, HelpCircle } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function Header() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const user = localStorage.getItem('loja-user');
            setIsLoggedIn(!!user);
        };

        checkAuth();
        // Listen for storage events (optional but good for syncing tabs) or custom events
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (search.trim()) {
            router.push(`/search?q=${search}`);
        }
    };

    // Categories Mapping (Enum -> Label)
    const categories = [
        { label: 'Veículos', value: 'VEHICLES' },
        { label: 'Supermercado', value: 'SUPERMARKET' },
        { label: 'Tecnologia', value: 'TECHNOLOGY' },
        { label: 'Casa e Móveis', value: 'HOME_FURNITURE' },
        { label: 'Eletrodomésticos', value: 'APPLIANCES' },
        { label: 'Esportes e Fitness', value: 'SPORTS_FITNESS' },
        { label: 'Ferramentas', value: 'TOOLS' },
        { label: 'Construção', value: 'CONSTRUCTION' },
        { label: 'Indústria e Comércio', value: 'INDUSTRY_COMMERCE' },
        { label: 'Para seu Negócio', value: 'BUSINESS' },
        { label: 'Pet Shop', value: 'PET_SHOP' },
        { label: 'Saúde', value: 'HEALTH' },
        { label: 'Acessórios para Veículos', value: 'VEHICLE_ACCESSORIES' },
        { label: 'Beleza e Cuidado Pessoal', value: 'BEAUTY_PERSONAL_CARE' },
        { label: 'Moda', value: 'FASHION' },
        { label: 'Bebês', value: 'BABIES' },
        { label: 'Brinquedos', value: 'TOYS' },
        { label: 'Imóveis', value: 'REAL_ESTATE' },
        { label: 'Outras Categorias', value: 'OTHER' },
    ];

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="w-full bg-white border-b border-gray-200 relative z-50">
            {/* Top Bar */}
            <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-8 h-20">

                {/* Logo */}
                <Link href="/" className="flex flex-col items-center">
                    <div className="relative w-10 h-10">
                        {/* Placeholder for Logo if image not available, using Icon */}
                        <ShoppingCart className="text-red-600 w-10 h-10" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-800 tracking-wider">E-COMMERCE</span>
                </Link>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar produtos..."
                        className="w-full border border-gray-400 rounded-sm px-4 py-2 text-sm focus:outline-none focus:border-red-600 text-black"
                    />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600">
                        <Search size={18} />
                    </button>
                </form>

                {/* Right Actions */}
                <div className="flex items-center gap-6 text-sm font-medium text-gray-700">
                    <Link href="/lojas" className="hover:text-red-600">Lojas</Link>
                    <Link href="/favorites" className="flex items-center gap-1 hover:text-red-600">
                        Favoritos
                    </Link>
                    {/* Account Dropdown */}
                    {isLoggedIn ? (
                        <div className="relative group">
                            <Link href="#" className="flex items-center gap-1 hover:text-red-600 py-4">
                                <User size={18} />
                                Conta
                            </Link>

                            {/* Dropdown Menu */}
                            <div className="absolute right-0 top-full pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                <div className="bg-white rounded-md shadow-xl border border-gray-100 overflow-hidden flex flex-col">
                                    <Link href="/orders" className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100">
                                        Ver histórico de compras
                                    </Link>
                                    <Link href="/profile/edit" className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100">
                                        Editar perfil
                                    </Link>
                                    <button className="px-4 py-3 text-sm text-gray-400 cursor-not-allowed text-left border-b border-gray-100">
                                        Gerenciar conta
                                    </button>
                                    <button
                                        onClick={() => {
                                            localStorage.removeItem('loja-user');
                                            localStorage.removeItem('access_token');
                                            window.location.href = '/';
                                        }}
                                        className="px-4 py-3 text-sm text-red-600 hover:bg-red-50 text-left font-medium"
                                    >
                                        Sair
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Link href="/login" className="flex items-center gap-1 hover:text-red-600">
                            <User size={18} />
                            Logar
                        </Link>
                    )}
                    <Link href="/cart" className="flex items-center gap-1 hover:text-red-600">
                        Carrinho
                    </Link>
                    <span className="flex items-center gap-1 text-gray-300 cursor-not-allowed select-none">
                        Ajuda?
                    </span>
                </div>
            </div>

            {/* Navigation Bar */}
            <div className="bg-white border-t border-gray-100 shadow-sm relative">
                <div className="container mx-auto px-4 py-3 flex gap-8 text-sm relative">
                    {/* Category Menu Trigger */}
                    <div
                        className="relative group"
                        onMouseEnter={() => setIsMenuOpen(true)}
                        onMouseLeave={() => setIsMenuOpen(false)}
                    >
                        <button
                            className="text-red-700 font-bold hover:underline py-1"
                        >
                            Categorias
                        </button>

                        {/* Dropdown Menu (Speech Bubble) */}
                        {isMenuOpen && (
                            <div className="absolute top-full left-0 pt-3 w-[600px] z-50">
                                {/* Triangle Arrow */}
                                <div className="absolute top-1 left-8 w-4 h-4 bg-white border-t border-l border-gray-200 rotate-45 z-10"></div>

                                {/* Box Content */}
                                <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 grid grid-cols-3 gap-y-4 gap-x-8 text-red-800 font-medium">
                                    {categories.map((cat) => (
                                        <Link
                                            key={cat.value}
                                            href={`/search?category=${cat.value}`}
                                            className="hover:underline hover:text-red-600 block"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            {cat.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <Link href="/search" className="text-red-700 font-bold hover:underline py-1">Melhores Produtos</Link>
                    <Link href="/search?sort=discount_desc" className="text-red-700 font-bold hover:underline py-1">Melhores Descontos</Link>
                </div>
            </div>
        </header>
    );
}
