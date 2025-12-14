'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/axios';
import { toast } from "sonner";
import { Loader2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<'EMAIL' | 'CODE' | 'PASSWORD'>('EMAIL');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Step 1: Send Email
    async function handleSendEmail(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            toast.success("Código enviado para o email!");
            setStep('CODE');
        } catch (err: any) {
            if (err.response?.status === 400) {
                toast.error("Email não encontrado.");
            } else {
                toast.error("Erro ao enviar email.");
            }
        } finally {
            setLoading(false);
        }
    }

    // Handle Code Input
    const handleCodeChange = (index: number, value: string) => {
        if (value.length > 1) return; // Only 1 char
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto focus next
        if (value !== '' && index < 5) {
            codeInputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && code[index] === '' && index > 0) {
            codeInputRefs.current[index - 1]?.focus();
        }
    };

    // Step 2: Verify Code
    async function handleVerifyCode(e: React.FormEvent) {
        e.preventDefault();
        const fullCode = code.join('');
        if (fullCode.length !== 6) return toast.error("Digite o código completo.");

        setLoading(true);
        try {
            await api.post('/auth/verify-code', { email, code: fullCode });
            toast.success("Código validado!");
            setStep('PASSWORD');
        } catch (err: any) {
            toast.error("Código inválido ou expirado.");
        } finally {
            setLoading(false);
        }
    }

    // Step 3: Reset Password
    async function handleResetPassword(e: React.FormEvent) {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            return toast.error("As senhas não coincidem.");
        }

        setLoading(true);
        try {
            const fullCode = code.join('');
            await api.post('/auth/reset-password', { email, code: fullCode, newPass: newPassword });
            toast.success("Senha alterada com sucesso!");
            router.push('/login');
        } catch (err: any) {
            toast.error("Erro ao alterar senha.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-red-900">
            <div className="w-full max-w-md min-h-[600px] p-8 bg-white rounded-xl shadow-2xl text-center flex flex-col justify-center relative">
                <button
                    onClick={() => router.push('/login')}
                    className="absolute top-4 left-4 text-gray-600 hover:text-red-600 transition"
                >
                    <ArrowLeft size={24} />
                </button>

                <div className="flex flex-col items-center mb-6">
                    <div className="text-red-600 font-bold text-2xl flex flex-col items-center">
                        {/* Placeholder for Logo, using text or simple icon if no image */}
                        <Image src="/image.png" alt="E-COMMERCE" width={200} height={200} />
                        {/* <span className="mt-2 text-sm tracking-widest text-black">E-COMMERCE</span> */}
                    </div>
                </div>

                {step === 'EMAIL' && (
                    <>
                        <h2 className="text-2xl font-bold mb-4 text-black">Recuperar Senha</h2>
                        <p className="text-gray-600 mb-6 text-sm">Digite seu email para receber o código.</p>
                        <form onSubmit={handleSendEmail} className="space-y-6">
                            <input
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
                            />
                            <button type="submit" disabled={loading} className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition disabled:opacity-50">
                                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Enviar Código'}
                            </button>
                        </form>
                    </>
                )}

                {step === 'CODE' && (
                    <>
                        <h2 className="text-2xl font-bold mb-4 text-black">Verificação</h2>
                        <p className="text-gray-600 mb-6 text-xs">
                            Um Código foi enviado para o email <br />
                            <strong>{email.replace(/(.{2})(.*)(@.*)/, "$1*****$3")}</strong>
                        </p>

                        <form onSubmit={handleVerifyCode} className="space-y-6">
                            <div className="flex justify-between gap-2 px-4">
                                {code.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => { codeInputRefs.current[index] = el }} // Correct ref assignment
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleCodeChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="w-10 h-12 text-center text-xl border border-gray-400 rounded-md focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none text-black"
                                    />
                                ))}
                            </div>

                            <button type="submit" disabled={loading} className="w-full border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50 transition mt-4 disabled:opacity-50">
                                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Continuar'}
                            </button>
                        </form>
                    </>
                )}

                {step === 'PASSWORD' && (
                    <>
                        <h2 className="text-2xl font-bold mb-4 text-black">Nova Senha</h2>
                        <p className="text-gray-600 mb-6 text-sm">Crie uma nova senha segura.</p>
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <input
                                type="password"
                                placeholder="Nova Senha"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
                            />
                            <input
                                type="password"
                                placeholder="Confirme a Nova Senha"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
                            />
                            <button type="submit" disabled={loading} className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition disabled:opacity-50">
                                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Alterar Senha'}
                            </button>
                        </form>
                    </>
                )}

            </div>
        </div>
    );
}
