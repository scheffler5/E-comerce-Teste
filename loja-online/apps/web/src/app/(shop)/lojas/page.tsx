'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Loader2, ShoppingBag, User } from 'lucide-react';
import Link from 'next/link';

export default function LojasPage() {
    const [sellers, setSellers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        api.get('/users/sellers')
            .then(res => setSellers(res.data))
            .catch(err => console.error("Failed to load sellers", err))
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-red-600" size={40} /></div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-2">Nossas Lojas Parceiras</h1>
            <p className="text-gray-600 mb-8">Encontre seus vendedores favoritos e descubra novos produtos.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sellers.map((seller) => (
                    <Link
                        href={`/lojas/${seller.id}`}
                        key={seller.id}
                        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition flex flex-col items-center text-center group"
                    >
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 mb-4 bg-gray-50 flex items-center justify-center">
                            {seller.avatarUrl ? (
                                <img src={seller.avatarUrl} alt={seller.name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="text-gray-400" size={40} />
                            )}
                        </div>

                        {/* Name */}
                        <h2 className="text-xl font-bold text-gray-800 group-hover:text-red-600 transition mb-2">
                            {seller.name}
                        </h2>

                        {/* Stats */}
                        <div className="flex items-center gap-2 text-gray-500 mb-6 bg-gray-50 px-3 py-1 rounded-full text-sm">
                            <ShoppingBag size={16} />
                            <span>{seller.productCount} produtos publicados</span>
                        </div>

                        {/* Footer - Top Categories */}
                        <div className="w-full border-t border-gray-100 pt-4 mt-auto">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Principais Categorias</span>
                            <div className="flex flex-wrap justify-center gap-2">
                                {seller.topCategories.length > 0 ? (
                                    seller.topCategories.map((cat: string) => (
                                        <span key={cat} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-md font-medium">
                                            {formatCategory(cat)}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs text-gray-400 italic">Vendedor novo</span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {!isLoading && sellers.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <p className="text-gray-500">Nenhum vendedor encontrado no momento.</p>
                </div>
            )}
        </div>
    );
}

// Helper to format category enum to nicer text
// Ideally this maps to the same labels as Header.tsx
function formatCategory(cat: string) {
    const map: any = {
        'VEHICLES': 'Veículos',
        'SUPERMARKET': 'Mercado',
        'TECHNOLOGY': 'Tecnologia',
        'HOME_FURNITURE': 'Casa & Móveis',
        'APPLIANCES': 'Eletros',
        'SPORTS_FITNESS': 'Esportes',
        'TOOLS': 'Ferramentas',
        'CONSTRUCTION': 'Construção',
        'INDUSTRY_COMMERCE': 'Indústria',
        'BUSINESS': 'Negócios',
        'PET_SHOP': 'Pet Shop',
        'HEALTH': 'Saúde',
        'VEHICLE_ACCESSORIES': 'Acessórios Auto',
        'BEAUTY_PERSONAL_CARE': 'Beleza',
        'FASHION': 'Moda',
        'BABIES': 'Bebês',
        'TOYS': 'Brinquedos',
        'REAL_ESTATE': 'Imóveis',
        'OTHER': 'Outros'
    };
    return map[cat] || cat;
}
