'use client';

import { useState } from 'react';
import api from '@/lib/axios';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
            setProgress(0);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        const userStr = localStorage.getItem('loja-user');
        if (!userStr) {
            toast.error('Usuário não identificado');
            return;
        }
        const user = JSON.parse(userStr);

        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post(`/products/upload?sellerId=${user.id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
                    setProgress(percentCompleted);
                }
            });

            setResult(res.data);
            setFile(null);
            toast.success('Importação concluída com sucesso!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao importar arquivo.');
            setResult(null);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8 text-black">Import CSV</h1>

            <div className="bg-white p-12 rounded-sm border border-black shadow-sm flex flex-col items-center justify-center min-h-[400px]">

                {!result ? (
                    <div className="w-full max-w-lg flex flex-col items-center gap-6">

                        {/* Upload Interface */}
                        <div className="w-full">
                            <label
                                htmlFor="csv-upload"
                                className={`
                                    flex flex-col items-center justify-center w-full h-64 border-2 border-black border-dashed rounded-sm cursor-pointer bg-gray-50 hover:bg-gray-100 transition
                                    ${uploading ? 'opacity-50 pointer-events-none' : ''}
                                `}
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    {file ? (
                                        <>
                                            <FileText className="w-16 h-16 text-green-600 mb-4" />
                                            <p className="mb-2 text-xl text-black font-medium">{file.name}</p>
                                            <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-16 h-16 text-gray-400 mb-4" />
                                            <p className="mb-2 text-xl text-black font-medium">Importe Seu Arquivo CSV</p>
                                            <p className="text-xs text-gray-500">Clique ou arraste o arquivo aqui</p>
                                        </>
                                    )}
                                </div>
                                <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileChange} disabled={uploading} />
                            </label>
                        </div>

                        {/* Actions / Progress */}
                        {uploading ? (
                            <div className="w-full space-y-2">
                                <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden border border-gray-400">
                                    <div
                                        className="bg-[#5858FA] h-6 rounded-full transition-all duration-300 flex items-center justify-center text-white text-xs font-bold"
                                        style={{ width: `${progress}%` }}
                                    >
                                        {progress > 10 && `${progress}%`}
                                    </div>
                                </div>
                                <p className="text-center text-gray-500 text-sm">Enviando e processando...</p>
                            </div>
                        ) : (
                            file && (
                                <button
                                    onClick={handleUpload}
                                    className="w-full py-4 bg-[#5858FA] text-white rounded-sm font-bold text-lg hover:bg-[#4545d9] transition shadow-md"
                                >
                                    Enviar Arquivo
                                </button>
                            )
                        )}

                    </div>
                ) : (
                    /* Result View */
                    <div className="w-full max-w-lg border border-black p-8 text-center animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-center mb-6">
                            <CheckCircle className="text-green-600 w-20 h-20" />
                        </div>
                        <h2 className="text-2xl font-bold text-black mb-2">Importação Concluída!</h2>
                        <p className="text-gray-600 mb-8">{result.message}</p>

                        <div className="bg-gray-100 p-6 rounded-sm mb-8 text-left border-l-4 border-[#5858FA]">
                            <p className="text-lg font-medium text-black">Resumo:</p>
                            <div className="mt-2 text-gray-700">
                                <p>Encontrados <span className="font-bold">{result.totalInserted}</span> Produtos</p>
                                {/* Assuming totalInserted roughly equates to lines processed successfully for now, backend response structure varies */}
                                <p>Lidas <span className="font-bold">{result.totalInserted}</span> linhas</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setResult(null)}
                            className="text-[#5858FA] font-bold hover:underline"
                        >
                            Importar outro arquivo
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
