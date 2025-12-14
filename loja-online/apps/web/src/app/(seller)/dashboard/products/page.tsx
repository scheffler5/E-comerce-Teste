'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Loader2, Plus, ShoppingBag, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProductsListPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const userStr = localStorage.getItem('loja-user');
            if (!userStr) return;
            const user = JSON.parse(userStr);

            // Fetching all products for the seller
            const res = await api.get(`/products?sellerId=${user.id}&limit=100`);
            setProducts(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-[calc(100vh-80px)]"><Loader2 className="animate-spin text-red-600" size={40} /></div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-black mb-1">Gerenciamento de Produtos</h1>
                    <h2 className="text-xl font-medium text-black">Meus Produtos</h2>
                </div>

                <Link
                    href="/dashboard/products/new"
                    className="bg-red-600 text-white font-bold py-2 px-6 rounded-sm hover:bg-red-700 transition flex items-center gap-2"
                >
                    <Plus size={20} />
                    Cadastrar Produto
                </Link>
            </div>

            {/* Product List */}
            <div className="space-y-4">
                {products.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 border border-gray-300 rounded-sm">
                        Você ainda não tem produtos cadastrados.
                    </div>
                ) : (
                    products.map((product) => (
                        <div
                            key={product.id}
                            onClick={() => router.push(`/dashboard/products/edit/${product.id}`)}
                            className="bg-white border border-gray-400 flex flex-col md:flex-row cursor-pointer hover:shadow-md transition group overflow-hidden h-auto md:h-48"
                        >
                            {/* Left: Image */}
                            <div className="w-full md:w-48 bg-gray-100 flex items-center justify-center flex-shrink-0 border-b md:border-b-0 md:border-r border-gray-400 relative">
                                {product.images && product.images.length > 0 ? (
                                    <img
                                        src={product.images[0].url}
                                        alt={product.name}
                                        className="w-full h-full object-contain p-2 mix-blend-multiply"
                                    />
                                ) : (
                                    <ShoppingBag className="text-gray-300" size={40} />
                                )}
                            </div>

                            {/* Middle: Info */}
                            <div className="flex-1 p-6 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-400">
                                <h3 className="text-xl font-medium text-gray-900 mb-2">{product.name}</h3>
                                <div className="text-2xl font-bold text-gray-900">
                                    R$ {Number(product.price).toFixed(2)}
                                </div>
                                {product.stockQuantity !== undefined && (
                                    <div className="text-sm text-gray-500 mt-2">
                                        Estoque: {product.stockQuantity} un.
                                    </div>
                                )}
                            </div>

                            {/* Right: Stats/Graph */}
                            <div className="flex-1 p-4 flex flex-col justify-center bg-white relative">
                                <div className="text-xs text-gray-400 text-center mb-2">Grafico e Informaçoes do Produto</div>
                                <div className="w-full h-24 flex items-center justify-center">
                                    {product.salesHistory && product.salesHistory.some((d: any) => d.revenue > 0) ? (
                                        <div className="w-full h-full">
                                            <SimpleLineChart data={product.salesHistory} />
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-300 italic">Sem vendas recentes</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function SimpleLineChart({ data }: { data: { date: string, revenue: number }[] }) {
    if (!data.length) return null;

    const maxRevenue = Math.max(...data.map(d => Number(d.revenue)));
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1 || 1)) * 100;
        const y = 100 - ((Number(d.revenue) / (maxRevenue || 1)) * 80);
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="w-full h-full relative overflow-hidden">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                {/* Simplified Grid */}
                <line x1="0" y1="100" x2="100" y2="100" stroke="#f3f4f6" strokeWidth="1" />

                <polyline
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="2"
                    points={points}
                    vectorEffect="non-scaling-stroke"
                />

                {/* Minimal Dots */}
                {data.map((d, i) => {
                    const x = (i / (data.length - 1 || 1)) * 100;
                    const y = 100 - ((Number(d.revenue) / (maxRevenue || 1)) * 80);
                    return (
                        <circle key={i} cx={x} cy={y} r="1.5" fill="#dc2626" />
                    )
                })}
            </svg>
        </div>
    );
}