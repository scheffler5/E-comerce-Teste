'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';

export default function CartPage() {
    const router = useRouter();
    const [cart, setCart] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('loja-user');
        if (!userStr) {
            router.push('/login');
            return;
        }

        const user = JSON.parse(userStr);
        fetchCart(user.id);
    }, []);

    const fetchCart = async (userId: string) => {
        try {
            const res = await api.get(`/cart?userId=${userId}`);
            setCart(res.data);
        } catch (error) {
            console.error("Failed to fetch cart", error);
            toast.error("Erro ao carregar carrinho");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) return;
        setUpdatingId(itemId);
        try {
            await api.patch(`/cart/${itemId}`, { quantity: newQuantity });
            // Optimistic update
            setCart((prev: any) => ({
                ...prev,
                items: prev.items.map((item: any) =>
                    item.id === itemId ? { ...item, quantity: newQuantity } : item
                )
            }));
            toast.success('Quantidade atualizada');
        } catch (error) {
            console.error('Erro ao atualizar quantidade:', error);
            toast.error('Erro ao atualizar quantidade');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleRemoveItem = async (itemId: string) => {
        try {
            await api.delete(`/cart/${itemId}`);
            toast.success("Item removido");
            const user = JSON.parse(localStorage.getItem('loja-user') || '{}');
            fetchCart(user.id);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao remover item");
        }
    };

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-red-600" size={40} /></div>;

    if (!cart || !cart.items || cart.items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">Seu Carrinho está vazio</h1>
                <p className="mb-4">Adicione produtos para ver aqui.</p>
                <button onClick={() => router.push('/')} className="text-red-600 underline">Voltar para a loja</button>
            </div>
        );
    }

    // Calculations
    let totalRaw = 0;
    let totalDiscorded = 0; // Total with discount applied

    cart.items.forEach((item: any) => {
        const p = item.product;
        const price = Number(p.price);
        const quantity = item.quantity;

        let finalPrice = price;
        if (p.discountValue) {
            if (p.discountType === 'FIXED_AMOUNT') {
                finalPrice = price - Number(p.discountValue);
            } else {
                finalPrice = price - (price * (Number(p.discountValue) / 100));
            }
        }

        totalRaw += price * quantity;
        totalDiscorded += finalPrice * quantity;
    });

    const savings = totalRaw - totalDiscorded;
    const savingsPercent = totalRaw > 0 ? (savings / totalRaw) * 100 : 0;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Carrinho</h1>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* List Items (Left) */}
                <div className="flex-1 space-y-4">
                    {cart.items.map((item: any) => {
                        const p = item.product;
                        const price = Number(p.price);
                        let finalPrice = price;
                        if (p.discountValue) {
                            if (p.discountType === 'FIXED_AMOUNT') {
                                finalPrice = price - Number(p.discountValue);
                            } else {
                                finalPrice = price - (price * (Number(p.discountValue) / 100));
                            }
                        }

                        return (
                            <div key={item.id} className="border border-gray-200 p-4 flex gap-4 bg-white relative">
                                <div className="w-24 h-24 bg-gray-100 flex-shrink-0 flex items-center justify-center">
                                    {p.images && p.images[0] ? (
                                        <img src={p.images[0].url} alt={p.name} className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-2xl">📱</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-lg">{p.name}</h3>
                                        <button onClick={() => handleRemoveItem(item.id)} className="text-gray-400 hover:text-red-500">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-1">{p.description}</p>

                                    <div className="mt-4 flex justify-between items-end">
                                        <div>
                                            {finalPrice < price ? (
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-400 line-through">R$ {price.toFixed(2)}</span>
                                                    <span className="font-bold text-lg">R$ {finalPrice.toFixed(2)}</span>
                                                </div>
                                            ) : (
                                                <span className="font-bold text-lg">R$ {price.toFixed(2)}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                disabled={updatingId === item.id || item.quantity <= 1}
                                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
                                            >
                                                -
                                            </button>
                                            <span className="font-semibold w-8 text-center">{item.quantity}</span>
                                            <button
                                                disabled={updatingId === item.id}
                                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Summary (Right) */}
                <div className="w-full lg:w-80 h-fit border border-gray-300 p-6 bg-white shadow-sm sticky top-24">
                    <h2 className="font-bold text-lg mb-4 border-b pb-2">Compras no Carrinho</h2>

                    <div className="space-y-2 mb-6 max-h-40 overflow-y-auto text-sm text-gray-600">
                        {cart.items.map((item: any) => (
                            <div key={item.id} className="flex justify-between">
                                <span>+{item.quantity} {item.product.name.substring(0, 15)}...</span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-1 mb-6 text-sm">
                        {cart.items.map((item: any) => {
                            const p = item.product;
                            return (
                                <div key={item.id} className="flex justify-between text-gray-500">
                                    <span>+ R$ {Number(p.price).toFixed(2)} (x{item.quantity})</span>
                                </div>
                            )
                        })}
                        <div className="border-t pt-2 mt-2 font-bold text-gray-800 flex justify-between">
                            <span>= Total Bruto</span>
                            <span>R$ {totalRaw.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold">Subtotal:</span>
                            <span className="font-bold text-xl">R$ {totalDiscorded.toFixed(2)}</span>
                        </div>
                        {savings > 0 && (
                            <div className="text-green-600 text-sm font-medium text-right bg-green-50 p-2 rounded">
                                Você economiza: R$ {savings.toFixed(2)} ({savingsPercent.toFixed(0)}%)
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => router.push('/checkout')}
                        className="w-full bg-red-600 text-white font-bold py-3 rounded-md hover:bg-red-700 transition"
                    >
                        Finalizar Compra
                    </button>
                </div>
            </div>
        </div>
    );
}
