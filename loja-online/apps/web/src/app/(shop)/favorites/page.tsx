'use client';

import { useEffect, useState } from 'react';
import { SearchProductItem } from '@/components/products/SearchProductItem';
import { Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { LoginModal } from '@/components/auth/LoginModal';
import Link from 'next/link';

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        // Get user from local storage
        const userStr = localStorage.getItem('loja-user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setUserId(user.id);
            } catch (e) {
                console.error("Failed to parse user data", e);
            }
        }
        setLoading(false); // Initial auth check done
    }, []);

    useEffect(() => {
        if (!userId) return;

        async function fetchFavorites() {
            setLoading(true);
            try {
                // Now using query param as refactored in backend
                const res = await api.get(`/favorites?userId=${userId}`);
                setFavorites(res.data);
            } catch (error) {
                console.error("Failed to fetch favorites", error);
            } finally {
                setLoading(false);
            }
        }

        fetchFavorites();
    }, [userId]);

    const handleAction = async (action: 'cart' | 'favorite', productId: string) => {
        if (action === 'favorite') {
            // Remove from list immediately (optimistic UI)
            setFavorites(prev => prev.filter(p => p.id !== productId));
            try {
                await api.delete(`/favorites/${productId}`, { data: { id: userId } });
            } catch (error) {
                console.error("Failed to remove favorite", error);
                // Re-fetch or add back if failed? For now keep simple.
            }
        } else {
            console.log("Add to cart", productId);
        }
    };

    if (!userId && !loading) {
        return (
            <div className="container mx-auto px-4 py-8 text-center bg-white">
                <h1 className="text-2xl font-bold mb-4">Favoritos</h1>
                <p className="mb-4">Você precisa estar logado para ver seus favoritos.</p>
                <Link href="/login" className="text-red-600 underline">Ir para Login</Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 bg-white min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Favoritos</h1>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-red-600" size={40} /></div>
            ) : (
                <>
                    {favorites.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            <p>Você ainda não tem nenhum favorito.</p>
                            <Link href="/" className="text-red-600 underline mt-2 block">Voltar a comprar</Link>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {favorites.map((p) => (
                                <SearchProductItem
                                    key={p.id}
                                    id={p.id}
                                    name={p.name}
                                    price={Number(p.price)}
                                    description={p.description}
                                    imageUrl={p.images?.[0]?.url}
                                    discountValue={p.discountValue ? Number(p.discountValue) : undefined}
                                    discountType={p.discountType}
                                    onAction={(action) => {
                                        if (action === 'favorite') handleAction('favorite', p.id);
                                        if (action === 'cart') {
                                            // TODO: Add to cart logic here too? checking if user wants it
                                            // For now just ignore or log
                                            handleAction('cart', p.id);
                                        }
                                    }}
                                    // For Favorites page, the item IS favorite, so icon should be filled/active.
                                    // We'll need to pass this state to SearchProductItem or it needs to be generic. 
                                    // I'll update SearchProductItem to accept `isFavorite` prop.
                                    isFavorite={true}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
