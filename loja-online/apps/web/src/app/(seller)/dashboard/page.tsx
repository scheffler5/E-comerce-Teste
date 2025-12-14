'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Loader2, ShoppingBag, Heart, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState<any>({});
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();

    useEffect(() => {
        const userStr = localStorage.getItem('loja-user');
        if (!userStr) {
            setDebugInfo({ message: "No user in localStorage" });
            setLoading(false);
            return;
        }

        try {
            const user = JSON.parse(userStr);
            setDebugInfo({ userInStorage: user, token: localStorage.getItem('loja-token')?.substring(0, 10) + '...' });

            api.get(`/products/dashboard?sellerId=${user.id}`)
                .then(res => setStats(res.data))
                .catch(err => {
                    console.error("Failed to load dashboard stats", err);
                    setError(err.message || "Erro desconhecido ao buscar dados");
                })
                .finally(() => setLoading(false));
        } catch (e) {
            setDebugInfo({ error: "Failed to parse user", raw: userStr });
            setLoading(false);
        }
    }, []);

    const handleAction = async (action: 'buy' | 'cart' | 'favorite', productId: string) => {
        const userStr = localStorage.getItem('loja-user');
        if (!userStr) return;

        const user = JSON.parse(userStr);

        if (action === 'cart') {
            try {
                await api.post('/cart', {
                    userId: user.id,
                    productId: productId,
                    quantity: 1
                });
                toast.success('Produto adicionado ao carrinho!');
            } catch (e) {
                console.error(e);
                toast.error('Erro ao adicionar produto ao carrinho.');
            }
        } else if (action === 'favorite') {
            try {
                await api.post(`/favorites/${productId}`, { id: user.id });
                toast.success('Lista de favoritos atualizada');
            } catch (e) {
                console.error(e);
                toast.error('Erro ao favoritar');
            }
        } else if (action === 'buy') {
            router.push(`/checkout?productId=${productId}&quantity=1`);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-[calc(100vh-80px)]"><Loader2 className="animate-spin text-red-600" size={40} /></div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <h1 className="text-3xl font-bold mb-8 text-black">DashBoard</h1>

            {/* Top Section: Chart + Mini Cards */}
            <div className="flex flex-col lg:flex-row border border-black h-auto lg:h-[400px] mb-12 bg-white">

                {/* Main Chart Card */}
                <div className="flex-1 p-4 flex flex-col border-b lg:border-b-0 lg:border-r border-black relative">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-medium text-black">Faturamento Total</h2>
                    </div>

                    <div className="flex-1 w-full flex items-end justify-center relative pb-4">
                        <div className="w-full h-full max-h-64">
                            {stats.revenueHistory && stats.revenueHistory.length > 0 ? (
                                <RevenueChart data={stats.revenueHistory} />
                            ) : (
                                <div className="text-gray-400 text-sm h-full flex items-center justify-center">
                                    Sem dados históricos suficientes
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Side Panel */}
                <div className="w-full lg:w-[350px] flex flex-col">
                    {/* Total Sold Card */}
                    <div className="flex-1 p-6 flex flex-col border-b border-black">
                        <h3 className="text-sm font-medium text-black mb-1">Total de produtos vendidos</h3>
                        <div className="mt-auto text-4xl font-bold text-center">{stats.totalSold || 0}</div>
                    </div>

                    {/* Total Registered Card */}
                    <div className="flex-1 p-6 flex flex-col">
                        <h3 className="text-sm font-medium text-black mb-1">Quantidade de produtos cadastrados</h3>
                        <div className="mt-auto text-4xl font-bold text-center">{stats.totalProducts || 0}</div>
                    </div>
                </div>
            </div>

            {/* Best Seller Section */}
            <div className="mb-12">
                <h2 className="text-xl font-medium mb-4 text-black">Produto Mais Vendido</h2>

                {stats.bestSeller ? (
                    <div className="border border-gray-300 rounded-sm p-4 hover:shadow-lg transition bg-white flex flex-col md:flex-row gap-6 relative group">

                        {/* Heart Button (Universal Top Right) */}
                        <div className="absolute right-4 top-4 z-20">
                            <button
                                onClick={() => handleAction('favorite', stats.bestSeller.id)}
                                className="p-2 rounded-full shadow-md transition bg-white text-gray-400 hover:text-red-500"
                            >
                                <Heart size={18} />
                            </button>
                        </div>

                        {/* Image Section */}
                        <div className="w-full md:w-64 aspect-[3/4] md:aspect-square bg-gray-100 relative flex items-center justify-center overflow-hidden rounded-sm flex-shrink-0">
                            {/* Tags */}
                            <div className="absolute top-2 left-2 z-10 flex gap-1">
                                <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-sm shadow-sm">
                                    Mais Vendido
                                </span>
                                {stats.bestSeller.discountValue && (
                                    <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm shadow-sm">
                                        {stats.bestSeller.discountType === 'FIXED_AMOUNT'
                                            ? `R$ ${stats.bestSeller.discountValue} OFF`
                                            : `${Math.floor(stats.bestSeller.discountValue)}% OFF`
                                        }
                                    </span>
                                )}
                            </div>

                            <Link href={`/dashboard/products/edit/${stats.bestSeller.id}`} className="w-full h-full flex items-center justify-center">
                                {stats.bestSeller.imageUrl ? (
                                    <img
                                        src={stats.bestSeller.imageUrl}
                                        alt={stats.bestSeller.name}
                                        className="w-full h-full object-contain mix-blend-multiply"
                                    />
                                ) : (
                                    <ShoppingBag size={48} className="text-gray-300" />
                                )}
                            </Link>
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 flex flex-col justify-between py-2">
                            <div>
                                <Link href={`/dashboard/products/edit/${stats.bestSeller.id}`} className="hover:underline">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{stats.bestSeller.name}</h3>
                                </Link>

                                <div className="mb-4">
                                    {stats.bestSeller.discountValue ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500 line-through">
                                                de R$ {Number(stats.bestSeller.price).toFixed(2)}
                                            </span>
                                            <span className="text-2xl font-bold text-gray-900">
                                                R$ {(Number(stats.bestSeller.price) - (
                                                    stats.bestSeller.discountType === 'FIXED_AMOUNT'
                                                        ? stats.bestSeller.discountValue
                                                        : (stats.bestSeller.price * stats.bestSeller.discountValue / 100)
                                                )).toFixed(2)}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-2xl font-bold text-gray-900">
                                            R$ {Number(stats.bestSeller.price).toFixed(2)}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-4 flex flex-col sm:flex-row gap-3 max-w-md">
                                    <Link
                                        href={`/dashboard/products/edit/${stats.bestSeller.id}`}
                                        className="flex-1 bg-red-600 text-white text-sm font-bold py-3 rounded-sm hover:bg-red-700 transition flex items-center justify-center gap-2"
                                    >
                                        Editar Produto
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="border border-gray-300 rounded-sm p-8 text-center text-gray-500 bg-white">
                        Ainda não há vendas suficientes para determinar o produto mais vendido.
                    </div>
                )}
            </div>
        </div>
    );
}

function RevenueChart({ data }: { data: { date: string, revenue: number }[] }) {
    if (!data.length) return null;

    const maxRevenue = Math.max(...data.map(d => Number(d.revenue)));

    // Normalize data for SVG
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1 || 1)) * 100;
        const normalizedRevenue = maxRevenue === 0 ? 0 : Number(d.revenue) / maxRevenue;
        const y = 100 - (normalizedRevenue * 80); // Adjust padding
        return `${x},${y}`;
    });

    const polylinePoints = points.join(' ');
    // Close loop for gradient
    const areaPoints = `${polylinePoints} 100,100 0,100`;

    return (
        <div className="w-full h-full flex flex-col">
            {/* Chart Area */}
            <div className="flex-1 relative overflow-hidden">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full block">
                    <defs>
                        <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#dc2626" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    {[0, 25, 50, 75, 100].map(y => (
                        <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#f3f4f6" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                    ))}

                    {/* Area Fill */}
                    <polygon points={areaPoints} fill="url(#chartGradient)" />

                    {/* Line */}
                    <polyline
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth="2"
                        points={polylinePoints}
                        vectorEffect="non-scaling-stroke"
                    />

                    {/* Interaction Points */}
                    {data.map((d, i) => {
                        const x = (i / (data.length - 1 || 1)) * 100;
                        const normalizedRevenue = maxRevenue === 0 ? 0 : Number(d.revenue) / maxRevenue;
                        const y = 100 - (normalizedRevenue * 80);
                        return (
                            <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r="4"
                                fill="transparent"
                                className="cursor-pointer group hover:fill-red-600"
                            >
                                <title>R$ {Number(d.revenue).toFixed(2)}</title>
                            </circle>
                        )
                    })}
                </svg>

            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between mt-2 px-1">
                {data.map((d, i) => (
                    <div key={i} className="text-[10px] text-gray-400 font-medium text-center" style={{ width: `${100 / data.length}%` }}>
                        {d.date.split('-')[1]}
                    </div>
                ))}
            </div>
        </div>
    );
}
