'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Loader2, Camera, X } from 'lucide-react';
import { toast } from 'sonner';

const PRODUCT_CATEGORIES: Record<string, string> = {
    TECHNOLOGY: 'Tecnologia',
    FASHION: 'Moda',
    HOME_FURNITURE: 'Casa e Móveis',
    APPLIANCES: 'Eletrodomésticos',
    BEAUTY_PERSONAL_CARE: 'Beleza e Cuidado Pessoal',
    SPORTS_FITNESS: 'Esportes e Fitness',
    TOOLS: 'Ferramentas',
    CONSTRUCTION: 'Construção',
    SUPERMARKET: 'Supermercado',
    TOYS: 'Brinquedos',
    BABIES: 'Bebês',
    PET_SHOP: 'Pet Shop',
    VEHICLES: 'Veículos',
    VEHICLE_ACCESSORIES: 'Acessórios para Veículos',
    HEALTH: 'Saúde',
    INDUSTRY_COMMERCE: 'Indústria e Comércio',
    BUSINESS: 'Para seu Negócio',
    REAL_ESTATE: 'Imóveis',
    OTHER: 'Outros'
};

export default function ProductCreatePage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    // State for the product form
    const [product, setProduct] = useState({
        name: '',
        description: '',
        price: '',
        discountValue: '',
        stockQuantity: '',
        category: 'OTHER'
    });

    // We can't upload images until the product exists (need ID).
    // So we'll store files locally and upload them AFTER creating the product.
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProduct(prev => ({ ...prev, [name]: value }));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);

            // Create previews
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));

            setSelectedFiles(prev => [...prev, ...newFiles]);
            setPreviewUrls(prev => [...prev, ...newPreviews]);
        }
    };

    const handleRemovePreview = (index: number) => {
        const newFiles = [...selectedFiles];
        const newPreviews = [...previewUrls];

        newFiles.splice(index, 1);
        newPreviews.splice(index, 1); // URL.revokeObjectURL could be good here but optional for simple act

        setSelectedFiles(newFiles);
        setPreviewUrls(newPreviews);
    };

    const handleSave = async () => {
        if (!product.name || !product.price) {
            toast.error('Nome e preço são obrigatórios');
            return;
        }

        setSaving(true);
        try {
            // 1. Get Seller ID (from local storage for now)
            const userStr = localStorage.getItem('loja-user');
            if (!userStr) {
                toast.error('Usuário não autenticado');
                return;
            }
            const user = JSON.parse(userStr);

            // 2. Create Product
            const payload = {
                name: product.name,
                description: product.description,
                price: Number(product.price),
                stockQuantity: product.stockQuantity ? Number(product.stockQuantity) : 0,
                // discountValue: product.discountValue ? Number(product.discountValue) : undefined, // Backend DTO might expect this
                category: product.category
            };

            const res = await api.post(`/products?sellerId=${user.id}`, payload);
            const newProduct = res.data;

            // 3. Upload Images (if any)
            if (selectedFiles.length > 0 && newProduct.id) {
                const uploadPromises = selectedFiles.map(file => {
                    const formData = new FormData();
                    formData.append('file', file);
                    return api.post(`/products/${newProduct.id}/images`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                });

                await Promise.all(uploadPromises);
            }

            toast.success('Produto cadastrado com sucesso!');
            router.push('/dashboard/products');

        } catch (error) {
            console.error(error);
            toast.error('Erro ao cadastrar produto');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <h1 className="text-3xl font-bold mb-8 text-black">Cadastrar Produto</h1>

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
                            placeholder="Ex: Smartphone XYZ"
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
                            placeholder="Detalhes do produto..."
                        />
                    </div>



                    <div>
                        <label className="block text-sm font-medium text-black mb-1">Categoria</label>
                        <select
                            name="category"
                            value={product.category}
                            onChange={handleChange}
                            className="w-full border border-black p-2 rounded-sm focus:outline-none focus:border-blue-600 bg-white"
                        >
                            {Object.entries(PRODUCT_CATEGORIES).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-black mb-1">Valor do Produto</label>
                            <input
                                type="number"
                                name="price"
                                value={product.price}
                                onChange={handleChange}
                                className="w-full border border-black p-2 rounded-sm focus:outline-none focus:border-blue-600"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-black mb-1">Estoque</label>
                            <input
                                type="number"
                                name="stockQuantity"
                                value={product.stockQuantity}
                                onChange={handleChange}
                                className="w-full border border-black p-2 rounded-sm focus:outline-none focus:border-blue-600"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Pending: Discount input if needed for creation, usually added later or optional */}
                </div>

                {/* Right Column: Image Preview (Local) */}
                <div className="w-full lg:w-[400px] flex flex-col gap-4">

                    <div className="border border-black bg-white p-0 overflow-hidden relative" style={{ aspectRatio: '1/1.2' }}>
                        <div className="flex h-full w-full">
                            {/* Thumbnails Sidebar */}
                            <div className="w-1/4 flex flex-col border-r border-black">
                                {[0, 1, 2, 3].map((idx) => {
                                    const preview = previewUrls[idx];
                                    return (
                                        <div key={idx} className="flex-1 border-b border-black last:border-b-0 relative flex items-center justify-center overflow-hidden bg-gray-50 group">
                                            {preview ? (
                                                <img src={preview} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-gray-300 text-xs">Foto {idx + 1}</span>
                                            )}
                                            {preview && (
                                                <div
                                                    onClick={() => handleRemovePreview(idx)}
                                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer z-10"
                                                >
                                                    <X className="text-white" size={20} />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Main Display */}
                            <div className="flex-1 relative flex items-center justify-center bg-gray-100">
                                {previewUrls[0] ? (
                                    <img src={previewUrls[0]} alt="Main" className="w-full h-full object-cover" />
                                ) : (
                                    <Camera size={48} className="text-gray-300" />
                                )}

                                {previewUrls.length > 4 && (
                                    <div className="absolute bottom-0 right-0 bg-gray-800/80 text-white px-4 py-2 font-bold">
                                        +{previewUrls.length - 4}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <label className="border border-black bg-white py-3 text-center text-black font-medium cursor-pointer hover:bg-gray-50 transition">
                        Adicionar Fotos
                        <input type="file" multiple className="hidden" accept="image/*" onChange={handleFileSelect} />
                    </label>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-[#5858FA] text-white py-3 font-medium rounded-md hover:bg-[#4545d9] transition shadow-sm disabled:opacity-50"
                    >
                        {saving ? 'Criando...' : 'Cadastrar Produto'}
                    </button>

                </div>

            </div>
        </div >
    );
}
