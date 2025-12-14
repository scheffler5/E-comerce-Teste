export const dynamic = 'force-dynamic';
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/products/ProductCard';
import { SearchProductItem } from '@/components/products/SearchProductItem';
import { LoginModal } from '@/components/auth/LoginModal';
import api from '@/lib/axios';
import { Loader2 } from 'lucide-react';

export default function SearchPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const sortBy = searchParams.get('sort') || '';
    const category = searchParams.get('category') || '';
    const [favorites, setFavorites] = useState<string[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<any>({});

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

    const handleToggleFavorite = async (product: any) => {
        if (!userId) {
            // Logic to show login modal (handled by wrapper or we can show modal here)
            // For now simple alert or reuse logic
            return;
        }

        const isFav = favorites.includes(product.id);

        // Optimistic Update
        let newFavorites;
        if (isFav) {
            newFavorites = favorites.filter(id => id !== product.id);
            // toast removed (optional)
        } else {
            newFavorites = [...favorites, product.id];
            // toast handled by component usually, or here
        }
        setFavorites(newFavorites);

        try {
            await api.post(`/favorites/${product.id}`, { id: userId });
            // The controller toggle handles both add/remove, but checking service:
            // Service returns "active: boolean".
            // Ideally we rely on that return, but logic matches optimistic.
        } catch (error) {
            console.error(error);
            // Revert on error properly in real app
        }
    };

    useEffect(() => {
        async function fetchProducts() {
            setLoading(true);
            try {
                const params: any = { search: query, page, limit: 12, sortBy };
                if (category) {
                    params.category = category;
                }

                const res = await api.get(`/products`, { params });
                console.log('Search API Params:', { search: query, page, limit: 12, sortBy, category });
                console.log('Search API Response:', res.data);
                setProducts(res.data.data);
                setMeta(res.data.meta);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        fetchProducts();
    }, [query, page, sortBy, category]);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-2">
                {sortBy === 'discount_desc' ? 'Melhores Ofertas' : 'Resultados da Pesquisa'}
            </h1>
            <h2 className="text-xl text-gray-700 mb-6">
                {sortBy === 'discount_desc'
                    ? 'Descontos Exclusivos'
                    : (category
                        ? `Categoria: ${category}`
                        : (query ? `"${query}"` : "Todos os produtos"))
                }
                <span className="text-sm font-normal text-gray-500 ml-2">{products.length} Resultados</span>
            </h2>

            <div className="flex gap-8">

                {/* Filters Sidebar */}
                <div className="w-64 flex-shrink-0 hidden md:block">
                    <div className="border border-gray-300 p-4 bg-white">
                        <h3 className="font-bold mb-4 text-sm">Filtros</h3>

                        <div className="mb-6">
                            <h4 className="text-xs font-bold text-gray-700 mb-2">Preço</h4>
                            <div className="space-y-1 text-sm text-gray-600">
                                <label className="flex items-center gap-2"><input type="checkbox" /> Até R$ 100</label>
                                <label className="flex items-center gap-2"><input type="checkbox" /> R$ 100 a R$ 500</label>
                                <label className="flex items-center gap-2"><input type="checkbox" /> Mais de R$ 500</label>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <input type="text" placeholder="Min" className="w-16 border px-2 py-1 text-xs" />
                                <input type="text" placeholder="Max" className="w-16 border px-2 py-1 text-xs" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results List */}
                <div className="flex-1">
                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-red-600" size={40} /></div>
                    ) : (
                        <>
                            {products.length === 0 ? (
                                <div className="text-center py-20 text-gray-500">Nenhum produto encontrado.</div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {products.map((p: any) => (
                                        <SearchProductItemWithLogic
                                            key={p.id}
                                            product={p}
                                            isFavorite={favorites.includes(p.id)}
                                            onToggleFavorite={() => handleToggleFavorite(p)}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Pagination */}
                            {meta.lastPage > 1 && (
                                <div className="flex justify-center gap-4 mt-8">
                                    <button
                                        disabled={page === 1}
                                        onClick={() => setPage(page - 1)}
                                        className="w-8 h-8 flex items-center justify-center border text-xs hover:bg-gray-100 disabled:opacity-50"
                                    >
                                        {'<'}
                                    </button>
                                    <span className="flex items-center text-sm">{page}</span>
                                    <button
                                        disabled={page === meta.lastPage}
                                        onClick={() => setPage(page + 1)}
                                        className="w-8 h-8 flex items-center justify-center border text-xs hover:bg-gray-100 text-black"
                                    >
                                        {'>'}
                                    </button>
                                    <span className="text-xs self-center ml-2 cursor-pointer hover:underline">Seguinte &gt;</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <LoginModal isOpen={false} onClose={() => { }} />
        </div>
    );
}

// Wrapper to handle login logic per item
function SearchProductItemWithLogic({ product, isFavorite, onToggleFavorite }: { product: any, isFavorite: boolean, onToggleFavorite: () => void }) {
    const [showLoginModal, setShowLoginModal] = useState(false);

    const handleAction = (action: 'cart' | 'favorite' | 'buy') => {
        const token = localStorage.getItem('loja-token');
        if (!token) {
            setShowLoginModal(true);
            return;
        }
        if (action === 'favorite') {
            onToggleFavorite();
            // Toast handling can be added here or parent
        } else if (action === 'cart') {
            try {
                api.post('/cart', {
                    userId: JSON.parse(localStorage.getItem('loja-user') || '{}').id,
                    productId: product.id,
                    quantity: 1
                }).then(() => {
                    // toast.success("Adicionado ao carrinho!"); // Requires toast in this file
                    console.log("Added to cart");
                });
            } catch (e) {
                console.error(e);
            }
        } else {
            console.log("Buy", product.id);
        }
    };

    return (
        <>
            <SearchProductItem
                id={product.id}
                name={product.name}
                price={Number(product.price)}
                description={product.description}
                imageUrl={product.images?.[0]?.url}
                discountValue={product.discountValue ? Number(product.discountValue) : undefined}
                discountType={product.discountType}
                isFavorite={isFavorite}
                onAction={(action) => handleAction(action)}
            />
            <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
        </>
    );
}
