'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Loader2, MapPin, Calendar, Mail, User, ShoppingBag } from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import { useParams } from 'next/navigation';

export default function SellerDetailsPage() {
    const params = useParams();
    const id = params.id as string;

    const [seller, setSeller] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        async function fetchData() {
            try {
                const [userRes, productsRes] = await Promise.all([
                    api.get(`/users/${id}`),
                    api.get(`/products`, { params: { sellerId: id, limit: 100 } }) // Fetch all/many products
                ]);

                setSeller(userRes.data);
                setProducts(productsRes.data.data);
            } catch (error) {
                console.error("Failed to load seller data", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-red-600" size={40} /></div>;
    }

    if (!seller) {
        return <div className="text-center py-20">Vendedor não encontrado.</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen pb-12">

            {/* Header / Cover */}
            <div className="bg-white border-b border-gray-200 pt-8">

                <div className="container mx-auto px-4 pb-8 flex flex-col md:flex-row items-center md:items-end gap-6 relative z-10">

                    {/* Avatar */}
                    <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center">
                        {seller.avatarUrl ? (
                            <img src={seller.avatarUrl} alt={seller.name} className="w-full h-full object-cover" />
                        ) : (
                            <User className="text-gray-300" size={64} />
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 mb-2 text-center md:text-left">
                        <h1 className="text-3xl font-bold text-gray-900">{seller.name}</h1>
                        <p className="text-gray-500 flex items-center justify-center md:justify-start gap-2 mt-1">
                            <Mail size={16} /> {seller.email}
                        </p>
                        <div className="flex items-center justify-center md:justify-start gap-4 mt-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                                <Calendar size={16} />
                                <span>Membro desde {new Date(seller.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <ShoppingBag size={16} />
                                <span>{products.length} produtos ativos</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <div className="container mx-auto px-4 py-8">
                <h2 className="text-2xl font-bold mb-6 border-l-4 border-red-600 pl-4">Produtos deste Vendedor</h2>

                {products.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-200">
                        <p className="text-gray-500">Este vendedor ainda não publicou produtos.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                title={product.name}
                                price={Number(product.price)}
                                imageUrl={product.images?.[0]?.url}
                                discountValue={product.discountValue ? Number(product.discountValue) : undefined}
                                discountType={product.discountType}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
