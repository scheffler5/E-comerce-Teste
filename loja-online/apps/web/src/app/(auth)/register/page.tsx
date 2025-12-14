'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/axios';
import { toast } from "sonner";
import { Loader2, ArrowLeft, Check } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState<'DATA' | 'CODE' | 'PASSWORD' | 'SUCCESS'>('DATA');

    // Step 1: Data
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'CLIENT' | 'SELLER'>('CLIENT');

    // Step 2: Code
    const [code, setCode] = useState(['', '', '', '', '', '']);

    // Step 3: Password
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Actions

    async function handleRegisterData(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/register', { name, email, role });
            toast.success("Código enviado para o email!");
            setStep('CODE');
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Erro ao iniciar cadastro.");
        } finally {
            setLoading(false);
        }
    }

    const handleCodeChange = (index: number, value: string) => {
        if (value.length > 1) return;
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);
        if (value !== '' && index < 5) codeInputRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && code[index] === '' && index > 0) {
            codeInputRefs.current[index - 1]?.focus();
        }
    };

    async function handleVerifyCode(e: React.FormEvent) {
        e.preventDefault();
        const fullCode = code.join('');
        if (fullCode.length !== 6) return toast.error("Digite o código completo.");

        setLoading(true);
        try {
            // Verify code
            await api.post('/auth/verify-code', { email, code: fullCode });
            toast.success("Código validado!");
            setStep('PASSWORD');
        } catch (err: any) {
            toast.error("Código inválido.");
        } finally {
            setLoading(false);
        }
    }

    async function handleCompleteRegistration(e: React.FormEvent) {
        e.preventDefault();
        if (password !== confirmPassword) return toast.error("As senhas não coincidem.");

        setLoading(true);
        try {
            const fullCode = code.join('');
            await api.post('/auth/register-complete', { email, code: fullCode, newPass: password });
            setStep('SUCCESS');
        } catch (err: any) {
            toast.error("Erro ao finalizar cadastro.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-red-900">
            <div className="w-full max-w-md min-h-[600px] p-8 bg-white rounded-xl shadow-2xl text-center flex flex-col justify-center relative">

                {step !== 'SUCCESS' && (
                    <button
                        onClick={() => {
                            if (step === 'DATA') router.push('/login');
                            else if (step === 'CODE') setStep('DATA');
                            else if (step === 'PASSWORD') setStep('CODE');
                        }}
                        className="absolute top-4 left-4 text-gray-600 hover:text-red-600 transition"
                    >
                        <ArrowLeft size={24} />
                    </button>
                )}

                <div className="flex flex-col items-center mb-6">
                    <div className="text-red-600 font-bold text-2xl flex flex-col items-center">
                        <Image src="/image.png" alt="E-COMMERCE" width={200} height={200} />
                    </div>
                </div>

                {/* STEP 1: DATA */}
                {step === 'DATA' && (
                    <>
                        <h2 className="text-2xl font-bold mb-4 text-black">Cadastro</h2>
                        <form onSubmit={handleRegisterData} className="space-y-4">
                            <div className="text-left">
                                <label className="block text-sm font-medium text-gray-700">Usuario</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
                                />
                            </div>
                            <div className="text-left">
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
                                />
                            </div>

                            <div className="flex justify-center gap-6 py-2">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="CLIENT"
                                        checked={role === 'CLIENT'}
                                        onChange={() => setRole('CLIENT')}
                                        className="text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-gray-700">Cliente</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="SELLER"
                                        checked={role === 'SELLER'}
                                        onChange={() => setRole('SELLER')}
                                        className="text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-gray-700">Vendedor</span>
                                </label>
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-white text-black border border-gray-400 py-2 rounded-md hover:bg-gray-50 transition">
                                {loading ? <Loader2 className="animate-spin mx-auto text-black" /> : 'Continuar'}
                            </button>
                        </form>
                    </>
                )}

                {/* STEP 2: CODE */}
                {step === 'CODE' && (
                    <>
                        <h2 className="text-2xl font-bold mb-4 text-black">Verificacao</h2>
                        <p className="text-gray-600 mb-6 text-sm">
                            Um Código foi enviado para o email {email.replace(/(.{2})(.*)(@.*)/, "$1*****$3")}
                        </p>
                        <form onSubmit={handleVerifyCode} className="space-y-6">
                            <div className="flex justify-between gap-2 px-4">
                                {code.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => { codeInputRefs.current[index] = el }}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleCodeChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="w-10 h-12 text-center text-xl border border-gray-400 rounded-md focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none text-black"
                                    />
                                ))}
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-white text-black border border-gray-400 py-2 rounded-md hover:bg-gray-50 transition">
                                {loading ? <Loader2 className="animate-spin mx-auto text-black" /> : 'Continuar'}
                            </button>
                        </form>
                    </>
                )}

                {/* STEP 3: PASSWORD */}
                {step === 'PASSWORD' && (
                    <>
                        <h2 className="text-2xl font-bold mb-4 text-black">Cadastro</h2>
                        <form onSubmit={handleCompleteRegistration} className="space-y-4">
                            <div className="text-left">
                                <label className="block text-sm font-medium text-gray-700">Criar Senha</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
                                />
                            </div>
                            <div className="text-left">
                                <label className="block text-sm font-medium text-gray-700">Confirmar Senha</label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
                                />
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-white text-black border border-gray-400 py-2 rounded-md hover:bg-gray-50 transition mt-4">
                                {loading ? <Loader2 className="animate-spin mx-auto text-black" /> : 'Criar'}
                            </button>
                        </form>
                    </>
                )}

                {/* STEP 4: SUCCESS */}
                {step === 'SUCCESS' && (
                    <>
                        <div className="flex flex-col items-center mb-6">
                            {/* Success Icon */}
                            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
                                <Check className="text-white w-8 h-8" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-4 text-black">Sucesso</h2>
                        <p className="text-gray-800 font-medium mb-8">
                            Cadastro Realizado com<br />Sucesso
                        </p>
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full bg-white text-black border border-gray-400 py-2 rounded-md hover:bg-gray-50 transition"
                        >
                            Voltar
                        </button>
                    </>
                )}

            </div>
        </div>
    );
}
