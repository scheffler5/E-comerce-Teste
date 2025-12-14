import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';

interface SearchProductItemProps {
    id: string;
    name: string;
    price: number;
    description?: string;
    imageUrl?: string;
    discountValue?: number;
    discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
    isFavorite?: boolean;
    onAction: (action: 'cart' | 'favorite' | 'buy') => void;
}

export function SearchProductItem({ id, name, price, description, imageUrl, discountValue, discountType, isFavorite, onAction }: SearchProductItemProps) {
    // Discount Calculation
    let finalPrice = price;
    // For search list, we might want a specific tag.

    if (discountValue) {
        const type = discountType || 'PERCENTAGE';
        if (type === 'PERCENTAGE') {
            finalPrice = price - (price * (discountValue / 100));
        } else if (type === 'FIXED_AMOUNT') {
            finalPrice = price - discountValue;
        }
    }
    const hasDiscount = finalPrice < price;

    return (
        <div className="bg-white border border-gray-200 p-4 flex gap-6 hover:shadow-md transition relative group-item">
            {/* Image (Left) */}
            <Link href={`/product/${id}`} className="w-48 h-48 bg-gray-100 flex-shrink-0 relative flex items-center justify-center block">
                {imageUrl ? (
                    <img src={imageUrl} alt={name} className="w-full h-full object-contain" />
                ) : (
                    <span className="text-4xl">📱</span>
                )}
            </Link>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAction('favorite');
                }}
                className={`absolute top-2 right-2 p-2 rounded-full transition z-10 ${isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-red-600'}`}
            >
                <Heart size={24} fill={isFavorite ? "currentColor" : "none"} />
            </button>

            {/* Info (Right) */}
            <div className="flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start">
                        <Link href={`/product/${id}`} className="hover:underline">
                            <h3 className="text-lg font-bold text-gray-800 mb-2">{name}</h3>
                        </Link>
                        {hasDiscount && (
                            <span className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded">
                                {(discountType || 'PERCENTAGE') === 'PERCENTAGE' ? `${Math.floor(discountValue ?? 0)}% OFF` : `R$ ${discountValue} OFF`}
                            </span>
                        )}
                    </div>
                    {/* Placeholder description if needed, or specs */}
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                        {description || 'Smartphone com processador de última geração, câmera de alta resolução e bateria de longa duração.'}
                    </p>
                </div>

                <div className="mt-auto">
                    {hasDiscount ? (
                        <div className="mb-4">
                            <span className="text-sm text-gray-500 line-through mr-2">de R$ {price.toFixed(2)}</span>
                            <p className="text-2xl font-bold text-gray-900">R$ {finalPrice.toFixed(2)}</p>
                        </div>
                    ) : (
                        <p className="text-2xl font-bold text-gray-900 mb-4">R$ {price.toFixed(2)}</p>
                    )}

                    <div className="flex gap-4">
                        <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full">
                            <button
                                onClick={() => onAction('buy')}
                                className="flex-1 bg-red-600 text-white font-bold py-2 rounded-md hover:bg-red-700 transition flex items-center justify-center gap-2"
                            >
                                Comprar Agora
                            </button>
                            <button
                                onClick={() => onAction('cart')}
                                className="flex-1 sm:flex-none sm:w-16 border border-gray-300 text-gray-600 font-bold py-2 rounded-md hover:bg-gray-100 transition flex items-center justify-center"
                                title="Adicionar ao Carrinho"
                            >
                                <ShoppingCart size={20} />
                            </button>
                        </div>
                        <p className="text-xs text-red-600 flex items-center font-bold">
                            +100 Vendidos
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
