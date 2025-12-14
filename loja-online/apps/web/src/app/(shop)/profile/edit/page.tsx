'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Camera, Trash2, Save, User, Mail, AlertTriangle } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';

export default function ProfileEditPage() {
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

    // Delete Confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);


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
            // Upload immediately
            const res = await api.patch(`/users/${user.id}/avatar`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Update local state
            setAvatarUrl(res.data.avatarUrl);
            toast.success('Foto de perfil atualizada!');

            // Update localStorage just in case
            const userStr = localStorage.getItem('loja-user');
            if (userStr) {
                const localUser = JSON.parse(userStr);
                localUser.avatarUrl = res.data.avatarUrl;
                localStorage.setItem('loja-user', JSON.stringify(localUser));
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

            // Update State
            setUser(res.data);
            toast.success('Perfil atualizado com sucesso!');

            // Update LocalStorage
            const userStr = localStorage.getItem('loja-user');
            if (userStr) {
                const localUser = JSON.parse(userStr);
                localUser.name = res.data.name;
                localUser.email = res.data.email;
                localStorage.setItem('loja-user', JSON.stringify(localUser));
            }

            // Clear password field
            setPassword('');

        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar alterações');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await api.delete(`/users/${user.id}`);
            toast.success('Conta deletada com sucesso.');

            // Logout and Redirect
            localStorage.removeItem('loja-user');
            localStorage.removeItem('access_token');
            window.location.href = '/';
        } catch (error) {
            console.error(error);
            toast.error('Erro ao deletar conta');
            setShowDeleteConfirm(false);
        }
    };


    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-red-600" size={40} /></div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-3xl font-bold mb-8">Editar Perfil</h1>

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
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                            <Camera className="text-white" />
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarChange}
                    />
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
                                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
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
                                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alterar Senha (Opcional)</label>
                        <div className="relative">
                            <input
                                type="password"
                                placeholder="Nova senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full bg-red-600 text-white font-bold py-3 rounded-md hover:bg-red-700 transition flex items-center justify-center gap-2"
                        >
                            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                            Salvar Alterações
                        </button>
                    </div>
                </form>

                <div className="my-8 border-t border-gray-100"></div>

                {/* Delete Account Area */}
                <div className="bg-red-50 border border-red-100 rounded-lg p-6">
                    <h3 className="text-red-800 font-bold flex items-center gap-2 mb-2">
                        <AlertTriangle size={20} />
                        Zona de Perigo
                    </h3>
                    <p className="text-sm text-red-600 mb-4">
                        Ao deletar sua conta, você perderá acesso ao seu histórico e perfil. Esta ação não pode ser desfeita pelo usuário.
                    </p>

                    {!showDeleteConfirm ? (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-md font-medium hover:bg-red-50 transition"
                        >
                            Deletar minha conta
                        </button>
                    ) : (
                        <div className="flex gap-3 items-center animate-in fade-in slide-in-from-top-2">
                            <button
                                onClick={handleDeleteAccount}
                                className="bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 transition"
                            >
                                Confirmar Exclusão
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
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
