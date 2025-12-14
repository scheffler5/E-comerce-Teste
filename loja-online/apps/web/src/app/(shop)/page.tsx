'use client';

import { HeroSection } from '@/components/home/HeroSection';
import { ProductRow } from '@/components/products/ProductRow';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Loader2 } from 'lucide-react';

export default function ShopHomePage() {
    const [bestSellers, setBestSellers] = useState([]);
    const [bestOffers, setBestOffers] = useState([]);
    const [newArrivals, setNewArrivals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [userId, setUserId] = useState<string | null>(null);

    // Initial Auth Check
    useEffect(() => {
        const userStr = localStorage.getItem('loja-user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setUserId(user.id);
            } catch (e) {
                console.error("Failed to parse user data", e);
            }
        }
    }, []);

    // Fetch favorites when user is known
    useEffect(() => {
        if (!userId) return;
        api.get(`/favorites?userId=${userId}`).then(res => {
            const ids = res.data.map((p: any) => p.id);
            setFavorites(ids);
        }).catch(err => console.error("Failed to load favorites", err));
    }, [userId]);

    useEffect(() => {
        async function fetchData() {
            try {
                const [resSellers, resOffers, resNew] = await Promise.all([
                    api.get('/products/best-sellers?limit=4'), // Limit 4
                    api.get('/products/best-offers?limit=4'),  // Limit 4
                    api.get('/products?limit=8'),              // Limit 8 for New Arrivals
                ]);
                setBestSellers(resSellers.data);
                setBestOffers(resOffers.data);
                setNewArrivals(resNew.data.data); // findAll returns { data: [], meta: {} }
            } catch (error) {
                console.error("Failed to fetch products", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleToggleFavorite = async (product: any) => {
        if (!userId) {
            // Can trigger a global login modal here if we expose setOpen from a context
            return;
        }

        const isFav = favorites.includes(product.id);

        let newFavorites;
        if (isFav) {
            newFavorites = favorites.filter(id => id !== product.id);
        } else {
            newFavorites = [...favorites, product.id];
        }
        setFavorites(newFavorites);

        try {
            await api.post(`/favorites/${product.id}`, { id: userId });
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-red-600" size={40} /></div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <HeroSection />

            {/* Show only if there are products, or show empty state if desired. 
                User requested: "caso nao existam tantos inserts assim de produtos nao adicione na pagina inicial produtos fakes" 
                So we hide rows if empty.
            */}

            {bestOffers.length > 0 && (
                <ProductRow title="Melhores Ofertas" products={bestOffers.map((p: any) => ({
                    id: p.id,
                    title: p.name,
                    price: Number(p.price),
                    imageUrl: p.images?.[0]?.url,
                    tag: 'Oferta',
                    discountValue: p.discountValue ? Number(p.discountValue) : undefined,
                    discountType: p.discountType,
                    isFavorite: favorites.includes(p.id),
                    onToggleFavorite: () => handleToggleFavorite(p)
                }))} />
            )}

            {bestSellers.length > 0 && (
                <ProductRow title="Mais Vendidos" products={bestSellers.map((p: any) => ({
                    id: p.id,
                    title: p.name,
                    price: Number(p.price),
                    imageUrl: p.images?.[0]?.url,
                    tag: 'Mais Vendido',
                    discountValue: p.discountValue ? Number(p.discountValue) : undefined,
                    discountType: p.discountType,
                    isFavorite: favorites.includes(p.id),
                    onToggleFavorite: () => handleToggleFavorite(p)
                }))} />
            )}

            {newArrivals.length > 0 && (
                <ProductRow title="Novidades" products={newArrivals.map((p: any) => ({
                    id: p.id,
                    title: p.name,
                    price: Number(p.price),
                    imageUrl: p.images?.[0]?.url,
                    tag: 'Novo',
                    discountValue: p.discountValue ? Number(p.discountValue) : undefined,
                    discountType: p.discountType,
                    isFavorite: favorites.includes(p.id),
                    onToggleFavorite: () => handleToggleFavorite(p)
                }))} />
            )}

            {bestOffers.length === 0 && bestSellers.length === 0 && newArrivals.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                    Nenhum produto encontrado.
                </div>
            )}
        </div>
    );
}
