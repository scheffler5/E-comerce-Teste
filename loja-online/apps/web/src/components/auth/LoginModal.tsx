'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const router = useRouter();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 relative animate-in fade-in zoom-in duration-200">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                    <X size={20} />
                </button>

                <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Olá, Visitante!</h2>
                    <p className="text-sm text-gray-600 mt-2">
                        Para adicionar itens ao carrinho ou favoritar, você precisa estar logado na sua conta de Cliente.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => router.push('/login')}
                        className="w-full bg-red-600 text-white py-2.5 rounded-md font-semibold hover:bg-red-700 transition"
                    >
                        Fazer Login
                    </button>

                    <button
                        onClick={() => router.push('/register')}
                        className="w-full bg-white text-gray-900 border border-gray-300 py-2.5 rounded-md font-semibold hover:bg-gray-50 transition"
                    >
                        Criar Conta
                    </button>
                </div>

            </div>
        </div>
    );
}
