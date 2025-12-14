'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Camera, User, Mail, AlertTriangle, Save } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';

export default function SellerProfilePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Form States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Confirm States
    const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('loja-user');
        if (!userStr) {
            router.push('/login');
            return;
        }
        const initialUser = JSON.parse(userStr);
        fetchUserData(initialUser.id);
    }, []);

    const fetchUserData = async (id: string) => {
        try {
            const res = await api.get(`/users/${id}`);
            const data = res.data;
            setUser(data);
            setName(data.name);
            setEmail(data.email);
            setAvatarUrl(data.avatarUrl);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar dados do usuário');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.patch(`/users/${user.id}/avatar`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setAvatarUrl(res.data.avatarUrl);
            toast.success('Foto de perfil atualizada!');

            // Update local storage to reflect avatar change immediately
            const userStr = localStorage.getItem('loja-user');
            if (userStr) {
                const u = JSON.parse(userStr);
                u.avatarUrl = res.data.avatarUrl;
                localStorage.setItem('loja-user', JSON.stringify(u));
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao fazer upload da imagem');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload: any = { name, email };
            if (password.trim()) {
                payload.password = password;
            }

            const res = await api.patch(`/users/${user.id}`, payload);
            setUser(res.data);
            toast.success('Perfil atualizado com sucesso!');

            // Update local storage
            const userStr = localStorage.getItem('loja-user');
            if (userStr) {
                const u = JSON.parse(userStr);
                u.name = res.data.name;
                u.email = res.data.email;
                localStorage.setItem('loja-user', JSON.stringify(u));
            }
            setPassword('');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar alterações');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeactivateStore = async () => {
        try {
            await api.patch(`/users/${user.id}/deactivate`);
            toast.success('Loja desativada com sucesso.');

            // Logout and Redirect
            localStorage.removeItem('loja-user');
            localStorage.removeItem('access_token'); // Make sure to clean up token if named this way, or 'loja-token'
            localStorage.removeItem('loja-token');
            router.push('/');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao desativar loja');
            setShowDeactivateConfirm(false);
        }
    };

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-red-600" size={40} /></div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-3xl font-bold mb-8 text-black">Editar Perfil</h1>

            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">

                {/* Avatar Section */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 bg-gray-100 flex items-center justify-center">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User size={48} className="text-gray-400" />
                            )}
                        </div>
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                            <Camera className="text-white" />
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    <p className="text-sm text-gray-500 mt-2">Clique para alterar a foto</p>
                </div>

                {/* Edit Form */}
                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alterar Senha (Opcional)</label>
                        <input
                            type="password"
                            placeholder="Nova senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 outline-none"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full bg-red-600 text-white font-bold py-3 rounded-md hover:bg-red-700 transition flex items-center justify-center gap-2 shadow-sm"
                        >
                            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                            Salvar Alterações
                        </button>
                    </div>
                </form>

                <div className="my-8 border-t border-gray-100"></div>

                {/* Deactivate Account Zone */}
                <div className="bg-red-50 border border-red-100 rounded-lg p-6">
                    <h3 className="text-red-800 font-bold flex items-center gap-2 mb-2">
                        <AlertTriangle size={20} />
                        Desativar Conta
                    </h3>
                    <p className="text-sm text-red-600 mb-4">
                        Ao desativar sua loja, seus produtos ficarão ocultos para os clientes. Você poderá reativá-la posteriormente entrando em contato com o suporte.
                    </p>

                    {!showDeactivateConfirm ? (
                        <button
                            onClick={() => setShowDeactivateConfirm(true)}
                            className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-md font-medium hover:bg-red-50 transition"
                        >
                            Desativar Loja (produtos ficarão ocultos)
                        </button>
                    ) : (
                        <div className="flex gap-3 items-center animate-in fade-in slide-in-from-top-2">
                            <button
                                onClick={handleDeactivateStore}
                                className="bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 transition"
                            >
                                Confirmar Desativação
                            </button>
                            <button
                                onClick={() => setShowDeactivateConfirm(false)}
                                className="text-gray-600 px-4 py-2 hover:underline"
                            >
                                Cancelar
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
