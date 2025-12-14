import { Smartphone, Tag } from 'lucide-react';
import Link from 'next/link';

export function HeroSection() {
    // We will use red gradients to mimic the images
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 h-[500px]">

            {/* Main Banner (Left) - Spans 1 col (50%) */}
            <Link href="/search?sort=discount_desc" className="relative shadow-lg transition hover:scale-[1.01] duration-300 rounded-lg overflow-hidden group cursor-pointer bg-red-700 block">
                <img
                    src="/imageBotao1.png"
                    alt="Aproveite as melhores ofertas"
                    className="w-full h-full object-contain"
                />
            </Link>

            {/* Side Banners (Right) - Spans 1 col (50%) */}
            <div className="flex flex-col gap-6">

                {/* Top Right Banner */}
                <div className="flex-1 bg-gradient-to-r from-red-800 to-red-600 rounded-lg p-6 relative overflow-hidden shadow-md flex flex-col justify-center">

                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30">
                        <Smartphone size={120} className="text-black" />
                    </div>

                    <div className="absolute top-4 right-4 bg-red-500 text-white font-bold rounded-full w-12 h-12 flex items-center justify-center -rotate-12 text-xs border border-white">
                        30%
                    </div>

                    <h3 className="text-white font-bold text-lg mb-2 z-10">Descontos em SmartPhones</h3>
                    <p className="text-white text-sm z-10">Encontre ate 50% <br /> de descontos</p>
                </div>

                {/* Bottom Right Banners (Split 2) */}
                <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-t from-red-900 to-red-700 rounded-lg p-4 relative flex flex-col justify-end shadow-sm">
                        <div className="absolute top-2 right-2 bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold rotate-12">
                            30%
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                            <Smartphone size={60} />
                        </div>
                        <span className="text-white text-xs font-medium z-10 text-center">Guarde ate 200 Reais</span>
                    </div>

                    <div className="bg-gradient-to-t from-red-900 to-red-700 rounded-lg p-4 relative flex flex-col justify-end shadow-sm">
                        <div className="absolute top-2 right-2 bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold -rotate-12">
                            20%
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                            <Smartphone size={60} />
                        </div>
                        <span className="text-white text-xs font-medium z-10 text-center">Compre Roupas</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
