'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/axios';
import { Loader2, Camera, ChevronLeft, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

export default function ProductEditPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [product, setProduct] = useState<any>({
        name: '',
        description: '',
        price: '',
        discountValue: '',
        images: []
    });

    useEffect(() => {
        if (params.id) {
            fetchProduct(params.id as string);
        }
    }, [params.id]);

    const fetchProduct = async (id: string) => {
        try {
            const res = await api.get(`/products/${id}`);
            setProduct(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar produto');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProduct((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Prepare payload - convert types
            const payload = {
                name: product.name,
                description: product.description,
                price: Number(product.price),
                discountValue: product.discountValue ? Number(product.discountValue) : undefined,
                discountType: product.discountValue ? 'FIXED_AMOUNT' : undefined // Defaulting for simplicity or add selector if needed
            };

            await api.patch(`/products/${params.id}`, payload);
            toast.success('Produto atualizado com sucesso!');
            router.push('/dashboard');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao atualizar produto');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('file', file);

            try {
                const res = await api.post(`/products/${params.id}/images`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                // Refresh product or add to state
                setProduct((prev: any) => ({
                    ...prev,
                    images: [...prev.images, res.data]
                }));
                toast.success('Imagem adicionada!');
            } catch (error) {
                console.error(error);
                toast.error('Erro ao enviar imagem');
            }
        }
    };

    const handleRemoveImage = async (imageId: string) => {
        if (!confirm('Tem certeza que deseja remover esta imagem?')) return;

        try {
            await api.delete(`/products/images/${imageId}`);
            setProduct((prev: any) => ({
                ...prev,
                images: prev.images.filter((img: any) => img.id !== imageId)
            }));
            toast.success('Imagem removida com sucesso');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao remover imagem');
        }
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
    }

    const mainImage = product.images?.[0]?.url || null;
    const additionalImages = product.images?.slice(1) || [];

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <h1 className="text-3xl font-bold mb-8 text-black">Gerenciamento de Produtos</h1>

            <div className="flex flex-col lg:flex-row gap-12">

                {/* Left Column: Form */}
                <div className="flex-1 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-black mb-1">Nome do Produto</label>
                        <input
                            type="text"
                            name="name"
                            value={product.name}
                            onChange={handleChange}
                            className="w-full border border-black p-2 rounded-sm focus:outline-none focus:border-blue-600"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-black mb-1">Descricao do Produto</label>
                        <textarea
                            name="description"
                            value={product.description}
                            onChange={handleChange}
                            rows={8}
                            className="w-full border border-black p-2 rounded-sm focus:outline-none focus:border-blue-600 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-black mb-1">Valor do Produto</label>
                        <input
                            type="number"
                            name="price"
                            value={product.price}
                            onChange={handleChange}
                            className="w-full border border-black p-2 rounded-sm focus:outline-none focus:border-blue-600"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-black mb-1">Adicionar desconto</label>
                        <input
                            type="number"
                            name="discountValue"
                            placeholder="Valor em R$"
                            value={product.discountValue || ''}
                            onChange={handleChange}
                            className="w-full border border-black p-2 rounded-sm focus:outline-none focus:border-blue-600"
                        />
                        <p className="text-xs text-gray-500 mt-1">Opcional. Valor fixo a ser descontado.</p>
                    </div>
                </div>

                {/* Right Column: Images */}
                <div className="w-full lg:w-[400px] flex flex-col gap-4">

                    {/* Main Image + Grid Container */}
                    <div className="border border-black bg-white p-0 overflow-hidden relative" style={{ aspectRatio: '1/1.2' }}>
                        {/* Prototype shows: Main image right, thumb strip left? Or is it a collage? */}
                        {/* Based on screenshot: Left strip of 4 small images, Right main large image. */}

                        <div className="flex h-full w-full">
                            {/* Thumbnails Sidebar (Left) */}
                            <div className="w-1/4 flex flex-col border-r border-black">
                                {[0, 1, 2, 3].map((idx) => {
                                    const img = product.images?.[idx];
                                    return (
                                        <div key={idx} className="flex-1 border-b border-black last:border-b-0 relative flex items-center justify-center overflow-hidden bg-gray-50 group">
                                            {img ? (
                                                <img src={img.url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-gray-300 text-xs">Foto {idx + 1}</span>
                                            )}
                                            {/* Delete Overlay */}
                                            {img && (
                                                <div
                                                    onClick={() => handleRemoveImage(img.id)}
                                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer z-10"
                                                >
                                                    <X className="text-white" size={20} />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Main Display (Right) - Showing 1st image or selected? Prototype implies 1st is just part of collection or the big one is the main preview. */}
                            {/* Actually, the prototype shows the *Product* usage. The user wants "edit logic". */}
                            {/* I will display the main image (first one) primarily here or allow selection. */}
                            {/* For simplicity matching the prototype layout exactly: */}
                            <div className="flex-1 relative flex items-center justify-center bg-gray-100">
                                {product.images?.[0] ? (
                                    <img src={product.images[0].url} alt="Main" className="w-full h-full object-cover" />
                                ) : (
                                    <Camera size={48} className="text-gray-300" />
                                )}

                                {/* +4 Overlay if more images */}
                                {product.images?.length > 4 && (
                                    <div className="absolute bottom-0 right-0 bg-gray-800/80 text-white px-4 py-2 font-bold">
                                        +{product.images.length - 4}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <label className="border border-black bg-white py-3 text-center text-black font-medium cursor-pointer hover:bg-gray-50 transition">
                        Adicionar ou Remover Foto
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-[#5858FA] text-white py-3 font-medium rounded-md hover:bg-[#4545d9] transition shadow-sm disabled:opacity-50"
                    >
                        {saving ? 'Gravando...' : 'Gravar'}
                    </button>

                </div>

            </div>
        </div>
    );
}
