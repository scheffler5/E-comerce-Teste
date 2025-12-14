'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ShoppingCart, Heart, ShieldCheck, Truck } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { BuyConfirmationModal } from '@/components/modals/BuyConfirmationModal';
import { ProductCard } from '@/components/products/ProductCard';
// import { LoginModal } from '@/components/auth/LoginModal';

export default function ProductDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;

    const [product, setProduct] = useState<any>(null);
    const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
    const [selectedImage, setSelectedImage] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<string[]>([]);
    // const [showLoginModal, setShowLoginModal] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [showBuyModal, setShowBuyModal] = useState(false);

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

    // Fetch Product & Favorites
    useEffect(() => {
        if (!id) return;

        async function fetchData() {
            setLoading(true);
            try {
                const res = await api.get(`/products/${id}`);
                setProduct(res.data);
                if (res.data.images && res.data.images.length > 0) {
                    setSelectedImage(res.data.images[0].url);
                }

                // Fetch Related
                if (res.data.category) {
                    const resRelated = await api.get(`/products?category=${res.data.category}&limit=5`);
                    // Filter out current product
                    const related = resRelated.data.data.filter((p: any) => p.id !== id).slice(0, 4);
                    setRelatedProducts(related);
                }

            } catch (error) {
                console.error("Failed to fetch product", error);
                toast.error("Erro ao carregar produto.");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);

    useEffect(() => {
        if (!userId) return;
        api.get(`/favorites?userId=${userId}`).then(res => {
            const ids = res.data.map((p: any) => p.id);
            setFavorites(ids);
        }).catch(err => console.error("Failed to load favorites", err));
    }, [userId]);

    const handleAction = async (action: 'buy' | 'cart' | 'favorite', targetId?: string) => {
        const idToUse = targetId || id;
        const token = localStorage.getItem('loja-token');
        const userStr = localStorage.getItem('loja-user');

        if (!token || !userStr) {
            router.push('/login');
            // setShowLoginModal(true);
            return;
        }

        const user = JSON.parse(userStr);

        if (action === 'cart') {
            try {
                await api.post('/cart', {
                    userId: user.id,
                    productId: idToUse,
                    quantity: targetId ? 1 : quantity // If targetId (Related) use 1, else use quantity state
                });
                toast.success('Adicionado ao carrinho!');
            } catch (e) {
                console.error(e);
                toast.error('Erro ao adicionar ao carrinho.');
            }
        } else if (action === 'buy') {
            // Direct redirect to checkout for "Buy Now"
            handleBuyAlone(user.id);
        } else if (action === 'favorite') {
            try {
                await api.post(`/favorites/${idToUse}`, { id: user.id });
                if (favorites.includes(idToUse as string)) {
                    setFavorites(prev => prev.filter(fid => fid !== idToUse));
                    toast.success('Removido dos favoritos', { position: 'bottom-center' });
                } else {
                    setFavorites(prev => [...prev, idToUse as string]);
                    toast.success('Adicionado aos favoritos', { position: 'bottom-center' });
                }
            } catch (e) {
                console.error(e);
                toast.error('Erro ao favoritar');
            }
        }
    };

    const handleBuyAlone = async (userId: string) => {
        // "Buy Alone":
        // 1. Add ONLY this item to cart (or direct checkout flow?).
        // User said: "ignora o carrinho e vai para o Checkout só com este item."
        // This implies we don't mix with cart items.
        // We might need a query param in CheckoutPage `?productId=...&qty=...` OR clear cart?
        // Let's use Query Param mode for Single Item Checkout as planned.
        router.push(`/checkout?productId=${id}&quantity=${quantity}`);
    };

    const handleBuyWithCart = async () => {
        const user = JSON.parse(localStorage.getItem('loja-user') || '{}');
        // Add to cart then go to checkout (which loads cart by default)
        try {
            await api.post('/cart', {
                userId: user.id,
                productId: id,
                quantity: quantity
            });
            setShowBuyModal(false);
            router.push('/checkout'); // Or /cart then checkout? User said "redireciona para a página do carrinho/checkout"
        } catch (e) {
            toast.error('Erro ao adicionar ao carrinho');
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-red-600" size={40} /></div>;
    if (!product) return <div className="text-center py-20">Produto não encontrado.</div>;

    const isFavorite = favorites.includes(product.id);
    const finalPrice = product.discountValue
        ? (product.discountType === 'FIXED_AMOUNT'
            ? Number(product.price) - Number(product.discountValue)
            : Number(product.price) * (1 - Number(product.discountValue) / 100))
        : Number(product.price);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">

                {/* 1. Image Gallery (Left - 4 cols) */}
                <div className="lg:col-span-5 flex gap-4">
                    {/* Thumbnails */}
                    <div className="flex flex-col gap-2">
                        {product.images?.map((img: any) => (
                            <button
                                key={img.id}
                                onClick={() => setSelectedImage(img.url)}
                                className={`w-16 h-16 border rounded-md overflow-hidden ${selectedImage === img.url ? 'border-red-600 ring-1 ring-red-600' : 'border-gray-200'}`}
                            >
                                <img src={img.url} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                    {/* Main Image */}
                    <div className="flex-1 border border-gray-100 bg-gray-50 flex items-center justify-center relative rounded-md overflow-hidden aspect-[3/4] lg:aspect-auto">
                        <img src={selectedImage || 'https://placehold.co/400x600?text=No+Image'} className="w-full h-full object-contain" />
                        <button
                            onClick={() => handleAction('favorite')}
                            className={`absolute top-4 right-4 p-2 rounded-full bg-white shadow-md ${isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-red-500'}`}
                        >
                            <Heart size={24} fill={isFavorite ? "currentColor" : "none"} />
                        </button>
                    </div>
                </div>

                {/* 2. Product Info (Center - 4 cols) */}
                <div className="lg:col-span-4 flex flex-col">
                    <span className="text-xs text-blue-600 font-semibold mb-2 cursor-pointer hover:underline">
                        Acesse a Loja de {product.seller?.name || 'Vendedor Parceiro'}
                    </span>

                    {product.discountValue && (
                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded w-fit mb-2">
                            Oferta do Dia
                        </span>
                    )}

                    <h1 className="text-2xl font-bold text-gray-900 mb-4">{product.name}</h1>

                    <div className="mb-6">
                        <span className="text-sm text-gray-500">Avaliações </span>
                        {/* Mock stars - keeping as functionality not requested yet */}
                        <span className="text-yellow-500 text-sm">★★★★☆ (12)</span>
                    </div>

                    <div className="mb-6">
                        {product.discountValue && (
                            <span className="text-sm text-gray-500 line-through block">de R$ {Number(product.price).toFixed(2)} por</span>
                        )}
                        <span className="text-4xl font-bold text-gray-900">R$ {finalPrice.toFixed(2)}</span>
                    </div>

                    <div className="mt-4">
                        <h3 className="font-bold text-gray-800 mb-2">Descrição</h3>
                        <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                            {product.description || "Nenhuma descrição disponível."}
                        </p>
                    </div>
                </div>

                {/* 3. Actions / Seller (Right - 3 cols) */}
                <div className="lg:col-span-3 border-l border-gray-200 pl-6 flex flex-col">
                    <p className="text-sm font-semibold mb-6">Estoque Disponível: {product.stockQuantity ?? 0}</p>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-sm font-bold text-gray-700">Quantidade:</span>
                        <div className="flex items-center gap-2 border border-gray-300 rounded p-1">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                                disabled={quantity <= 1}
                            >
                                -
                            </button>
                            <span className="w-8 text-center font-bold text-gray-800">{quantity}</span>
                            <button
                                onClick={() => setQuantity(Math.min(product.stockQuantity || 99, quantity + 1))}
                                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                                disabled={quantity >= (product.stockQuantity || 99)}
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3 mb-8">
                        <button
                            onClick={() => handleAction('buy')}
                            className="w-full bg-red-600 text-white font-bold py-3 rounded-md hover:bg-red-700 transition shadow-sm"
                        >
                            Comprar
                        </button>
                        <button
                            onClick={() => handleAction('cart')}
                            className="w-full bg-red-100 text-red-700 font-bold py-3 rounded-md hover:bg-red-200 transition shadow-sm border border-red-200"
                        >
                            Adicionar ao Carrinho
                        </button>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="text-sm font-bold text-gray-700 mb-4">Vendedor</h4>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center font-bold text-gray-500">
                                {product.seller?.name?.[0] || 'V'}
                            </div>
                            <div>
                                <p className="text-sm font-bold">{product.seller?.name || 'Vendedor'}</p>
                                <p className="text-[10px] text-green-600 font-semibold flex items-center gap-1">
                                    <ShieldCheck size={12} /> Autenticado por Ecomerce
                                </p>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                            <Truck size={14} /> <span>Entrega em todo o país</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Related Products */}
            <div className="mb-12">
                <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Produtos Relacionados</h2>

                {relatedProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {relatedProducts.map((p) => (
                            <ProductCard
                                key={p.id}
                                id={p.id} // Pass Id!
                                title={p.name}
                                price={Number(p.price)}
                                imageUrl={p.images?.[0]?.url}
                                discountValue={p.discountValue ? Number(p.discountValue) : undefined}
                                discountType={p.discountType}
                                tag="Relacionado"
                                isFavorite={favorites.includes(p.id)}
                                onToggleFavorite={() => handleAction('favorite', p.id)} // Passing ID!
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-500 py-4">Não encontramos produtos relacionados</div>
                )}
            </div>
            {/* <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} /> */}
        </div>
    );
}
