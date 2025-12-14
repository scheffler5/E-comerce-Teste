'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/axios';
import { toast } from "sonner";
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { identifier: email, password });
      localStorage.setItem('loja-token', response.data.access_token);
      localStorage.setItem('loja-user', JSON.stringify(response.data.user));

      toast.success("Login realizado com sucesso!");

      if (response.data.user.role === 'SELLER') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      toast.error("Email/Usuário ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="flex items-center justify-center min-h-screen bg-red-900">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <Image
            src="/image.png"
            alt="Logo E-Commerce"
            width={200}
            height={200}
            className="mb-2"
          />
        </div>

        {/* Título */}
        <h2 className="text-2xl font-bold text-center mb-8">LOGIN</h2>

        {/* Formulário */}
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="user" className="block text-sm font-medium text-gray-700">
              Usuário ou Email
            </label>
            <input
              type="text"
              id="user"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
            />
            <div className="flex justify-end mt-1">
              <a href="/forgot-password" className="text-sm text-blue-500 hover:underline">
                Esqueceu sua senha
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Logar'}
            </button>
          </div>
        </form>

        {/* Rodapé */}
        <div className="mt-6 text-center text-sm">
          <p className="text-blue-500">
            Não tem Conta?
            <br />
            <a href="/register" className="hover:underline font-medium">
              se Cadastre
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}