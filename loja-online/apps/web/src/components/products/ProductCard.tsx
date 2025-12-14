import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';
import { useState } from 'react';
// import { LoginModal } from '../auth/LoginModal';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

interface ProductCardProps {
    id?: string;
    title: string;
    price: number;
    installments?: string;
    tag?: string;
    imageUrl?: string;
    discountValue?: number;
    discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
}


export function ProductCard({ id, title, price, installments, tag, imageUrl, discountValue, discountType, isFavorite, onToggleFavorite }: ProductCardProps) {
    const router = useRouter();
    // const [showLoginModal, setShowLoginModal] = useState(false);
    const [internalFavorite, setInternalFavorite] = useState(isFavorite || false);

    // Sync with prop if it changes (e.g. parent fetch updates)
    // safe because React batches? or use useEffect?
    // Let's use simple state but if prop updates we might want to sync?
    // For now, assume prop is initial value.
    // Actually, if we use onToggleFavorite, we rely on parent.
    // If autonomous, we use state.
    // Use derived state for rendering:
    const isFav = onToggleFavorite ? isFavorite : internalFavorite;

    // Discount Calculation
    let finalPrice = price;
    let discountBadge = ''; // Shows % or Value OFF

    if (discountValue) {
        // Default to PERCENTAGE if type is missing but value exists
        const type = discountType || 'PERCENTAGE';

        if (type === 'PERCENTAGE') {
            finalPrice = price - (price * (discountValue / 100));
            discountBadge = `${Math.floor(discountValue)}% OFF`;
        } else if (type === 'FIXED_AMOUNT') {
            finalPrice = price - discountValue;
            discountBadge = `R$ ${discountValue} OFF`;
        }
    }

    const hasDiscount = finalPrice < price;

    const handleAction = async (action: 'buy' | 'cart' | 'favorite') => {
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
                    productId: id,
                    quantity: 1
                });
                toast.success('Produto adicionado ao carrinho!');
            } catch (e) {
                console.error(e);
                toast.error('Erro ao adicionar produto ao carrinho.');
            }
        } else if (action === 'favorite') {
            if (onToggleFavorite) {
                onToggleFavorite();
            } else {
                // Autonomous Mode
                try {
                    await api.post(`/favorites/${id}`, { id: user.id });
                    console.log('API call success, calling toast');
                    setInternalFavorite(!internalFavorite);
                    toast.success(internalFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos', { position: 'top-center' });
                } catch (e) {
                    console.log('API call failed', e);
                    console.error(e);
                    toast.error('Erro ao favoritar');
                }
            }
        } else if (action === 'buy') {
            router.push(`/checkout?productId=${id}&quantity=1`);
        }
    };

    return (
        <>
            <div className="border border-gray-300 rounded-sm p-4 hover:shadow-lg transition bg-white flex flex-col h-full group relative">

                <Link href={`/product/${id}`} className="block">
                    {/* Image Placeholder */}
                    <div className="aspect-[3/4] bg-gray-100 mb-4 relative flex items-center justify-center overflow-hidden">

                        {/* Tags Container - Top Left, Horizontal Layout */}
                        <div className="absolute top-2 left-2 z-10 flex gap-1">
                            {/* Main Semantic Tag (Novo, Mais Vendido, etc.) */}
                            {tag && (
                                <span className={`text-white text-[10px] font-bold px-2 py-1 rounded-sm shadow-sm
                                    ${tag === 'Mais Vendido' ? 'bg-orange-500' :
                                        tag === 'Novo' ? 'bg-green-600' :
                                            'bg-blue-600' /* Default/Oferta */}
                                `}>
                                    {tag}
                                </span>
                            )}

                            {/* Discount Badge (Side by side) */}
                            {hasDiscount && (
                                <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm shadow-sm">
                                    {discountBadge}
                                </span>
                            )}
                        </div>

                        {imageUrl ? (
                            // Use a helper or just try to render. We might need a generic image handler if URL is broken.
                            <img
                                src={imageUrl}
                                alt={title}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://placehold.co/300x400?text=No+Image';
                                }}
                            />
                        ) : (
                            <div className="text-gray-300 group-hover:scale-105 transition duration-300 text-4xl">
                                📱
                            </div>
                        )}
                        {/* Hover Actions */}
                        <div className="absolute right-2 top-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {/* Prevent link propagation if needed, but absolute pos usually on top. */}
                            {/* But since we wrapped the whole image div in Link, buttons inside might trigger navigation if not handled. */}
                            {/* React event propagation needs stopPropagation on buttons */}
                        </div>
                    </div>
                </Link>

                {/* Move Heart Button outside Link or handle stopPropagation */}
                {/* DEBUG: Removed opacity-0 to test visibility */}
                <div className="absolute right-4 top-4 z-20">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAction('favorite');
                        }}
                        className={`p-2 rounded-full shadow-md transition ${isFav ? 'bg-white text-yellow-500' : 'bg-white text-gray-400 hover:text-red-500'}`}
                    >
                        <Heart size={18} fill={isFav ? "currentColor" : "none"} />
                    </button>
                </div>

                <div className="mt-auto">
                    <Link href={`/product/${id}`} className="hover:underline">
                        <h3 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2">{title}</h3>
                    </Link>

                    <div className="mb-1">
                        {hasDiscount ? (
                            <>
                                <span className="text-xs text-gray-500 line-through mr-2">de R$ {price.toFixed(2)}</span>
                                <span className="text-lg font-bold text-gray-900">R$ {finalPrice.toFixed(2)}</span>
                            </>
                        ) : (
                            <span className="text-lg font-bold text-gray-900">R$ {price.toFixed(2)}</span>
                        )}
                    </div>

                    {installments && (
                        <p className="text-[10px] text-red-600">{installments}</p>
                    )}

                    <button
                        onClick={() => handleAction('buy')}
                        className="w-full mt-3 bg-red-600 text-white text-sm font-bold py-2 rounded-sm hover:bg-red-700 transition flex items-center justify-center gap-2"
                    >
                        Comprar
                    </button>
                    <button
                        onClick={() => handleAction('cart')}
                        className="w-full mt-2 border border-red-600 text-red-600 text-sm font-bold py-2 rounded-sm hover:bg-red-50 transition flex items-center justify-center gap-2"
                    >
                        <ShoppingCart size={16} />
                        Adicionar
                    </button>
                </div>

            </div>

            {/* <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} /> */}
        </>
    );
}
