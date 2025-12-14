'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CreditCard, ShieldCheck } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const productId = searchParams.get('productId');
    const quantityParam = searchParams.get('quantity');

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<any[]>([]);
    const [total, setTotal] = useState(0);

    // Form Mock
    const [cards, setCards] = useState([
        { id: '1', number: '**** **** **** 4242', brand: 'mastercard' }
    ]);

    useEffect(() => {
        const userStr = localStorage.getItem('loja-user');
        if (!userStr) {
            router.push('/login?redirect=/checkout');
            return;
        }
        const user = JSON.parse(userStr);
        loadItems(user.id);
    }, []);

    const loadItems = async (userId: string) => {
        setLoading(true);
        try {
            if (productId) {
                // Single Item Mode
                const res = await api.get(`/products/${productId}`);
                const product = res.data;
                const qty = quantityParam ? parseInt(quantityParam) : 1;

                // Calculate Discounted Price
                let price = Number(product.price);
                if (product.discountValue) {
                    if (product.discountType === 'FIXED_AMOUNT') {
                        price -= Number(product.discountValue);
                    } else {
                        price -= (price * (Number(product.discountValue) / 100));
                    }
                }

                setItems([{
                    product: product,
                    quantity: qty,
                    price: price, // Final Unit Price
                    total: price * qty
                }]);
                setTotal(price * qty);

            } else {
                // Cart Mode
                const res = await api.get(`/cart?userId=${userId}`);
                const cartItems = res.data?.items || [];

                let calculatedTotal = 0;
                const mappedItems = cartItems.map((item: any) => {
                    const p = item.product;
                    let price = Number(p.price);
                    if (p.discountValue) {
                        if (p.discountType === 'FIXED_AMOUNT') {
                            price -= Number(p.discountValue);
                        } else {
                            price -= (price * (Number(p.discountValue) / 100));
                        }
                    }
                    calculatedTotal += price * item.quantity;
                    return {
                        product: p,
                        quantity: item.quantity,
                        price: price,
                        total: price * item.quantity
                    };
                });

                setItems(mappedItems);
                setTotal(calculatedTotal);
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar checkout");
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = async () => {
        const userStr = localStorage.getItem('loja-user');
        if (!userStr) return;
        const user = JSON.parse(userStr);

        setLoading(true);
        try {
            // Prepare Order Data
            // Backend expects: userId, items: [{ productId, quantity, price, sellerId }]
            const orderPayload = {
                userId: user.id,
                items: items.map(item => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                    price: item.price,
                    sellerId: item.product.sellerId // BE needs to return this!
                }))
            };

            await api.post('/orders', orderPayload);
            toast.success('Compra realizada com sucesso!');
            router.push('/orders'); // Or success page
        } catch (error) {
            console.error(error);
            toast.error('Erro ao finalizar compra');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-red-600" size={40} /></div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Payment & Address */}
                <div className="space-y-6">
                    {/* Address (Mock) */}
                    <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <ShieldCheck className="text-green-600" /> Endereço de Entrega
                        </h2>
                        <div className="text-gray-600 text-sm">
                            <p className="font-bold text-gray-800">Gabriel (Casa)</p>
                            <p>Rua Exemplo, 123 - Bairro Teste</p>
                            <p>São Paulo - SP, 00000-000</p>
                            <button className="text-blue-600 text-xs mt-2 hover:underline">Alterar endereço</button>
                        </div>
                    </div>

                    {/* Payment */}
                    <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <CreditCard className="text-blue-600" /> Pagamento
                        </h2>

                        <div className="space-y-3">
                            {cards.map(card => (
                                <div key={card.id} className="flex items-center gap-3 p-3 border border-red-200 bg-red-50 rounded cursor-pointer">
                                    <input type="radio" checked readOnly className="accent-red-600" />
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-800">Cartão de Crédito</p>
                                        <p className="text-sm text-gray-500">{card.number}</p>
                                    </div>
                                    <CreditCard size={20} className="text-gray-600" />
                                </div>
                            ))}
                            <button className="text-red-600 text-sm font-bold hover:underline">+ Adicionar novo cartão</button>
                        </div>
                    </div>
                </div>

                {/* Right: Summary */}
                <div>
                    <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm sticky top-24">
                        <h2 className="text-xl font-bold mb-6">Resumo do Pedido</h2>

                        <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
                            {items.map((item, idx) => (
                                <div key={idx} className="flex gap-4 border-b border-gray-100 pb-4">
                                    <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded overflow-hidden">
                                        {item.product.images?.[0] ? (
                                            <img src={item.product.images[0].url} className="w-full h-full object-cover" />
                                        ) : (
                                            <span>📱</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm line-clamp-2">{item.product.name}</p>
                                        <div className="flex justify-between text-sm mt-1">
                                            <span className="text-gray-500">Qtd: {item.quantity}</span>
                                            <span className="font-bold">R$ {(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2 border-t border-gray-200 pt-4 mb-6">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>R$ {total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Frete</span>
                                <span className="text-green-600 font-bold">Grátis</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t mt-2">
                                <span>Total</span>
                                <span>R$ {total.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleFinish}
                            className="w-full bg-red-600 text-white font-bold py-4 rounded-md hover:bg-red-700 transition shadow-lg text-lg"
                        >
                            Finalizar Compra
                        </button>

                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                            <ShieldCheck size={14} /> Ambiente 100% Seguro
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-red-600" size={40} /></div>}>
            <CheckoutContent />
        </Suspense>
    );
}
