'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Package, Calendar, Clock } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';

export default function OrdersPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<any[]>([]);

    useEffect(() => {
        const userStr = localStorage.getItem('loja-user');
        if (!userStr) {
            router.push('/login');
            return;
        }
        const user = JSON.parse(userStr);
        fetchOrders(user.id);
    }, []);

    const fetchOrders = async (userId: string) => {
        try {
            const res = await api.get(`/orders?userId=${userId}`);
            setOrders(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar pedidos");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-red-600" size={40} /></div>;

    if (orders.length === 0) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <Package size={64} className="mx-auto text-gray-300 mb-4" />
                <h1 className="text-2xl font-bold mb-4">Você ainda não tem pedidos</h1>
                <p className="mb-4 text-gray-500">Comece a comprar agora mesmo!</p>
                <button onClick={() => router.push('/')} className="text-red-600 underline">Ir para a loja</button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Meus Pedidos</h1>

            <div className="space-y-6">
                {orders.map((order) => {
                    const date = new Date(order.createdAt).toLocaleDateString('pt-BR');

                    return (
                        <div key={order.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                            <div className="bg-gray-50 p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                                <div className="flex gap-6">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Pedido Realizado</p>
                                        <p className="text-sm font-medium flex items-center gap-1"><Calendar size={14} /> {date}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Total</p>
                                        <p className="text-sm font-medium">R$ {Number(order.totalAmount).toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Status</p>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                            {order.status === 'PENDING' ? 'Processando' : order.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400 font-mono">
                                    ID: {order.id}
                                </div>
                            </div>

                            <div className="p-6">
                                {order.items?.map((item: any) => (
                                    <div key={item.id} className="flex gap-4 mb-4 last:mb-0">
                                        <div className="w-20 h-20 bg-gray-100 flex-shrink-0 flex items-center justify-center rounded">
                                            {item.product?.images?.[0] ? (
                                                <img src={item.product.images[0].url} className="w-full h-full object-contain p-2" />
                                            ) : (
                                                <span>📱</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-800">{item.product?.name || 'Produto indisponível'}</h3>
                                            <p className="text-sm text-gray-500 line-clamp-2">{item.product?.description}</p>
                                            <div className="mt-2 text-sm font-semibold">
                                                {item.quantity}x R$ {Number(item.unitPrice).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
