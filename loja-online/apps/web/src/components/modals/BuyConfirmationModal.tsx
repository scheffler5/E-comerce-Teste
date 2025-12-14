import { X, ShoppingCart, CreditCard } from 'lucide-react';

interface BuyConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBuyAlone: () => void;
    onBuyWithCart: () => void;
    productName: string;
}

export function BuyConfirmationModal({ isOpen, onClose, onBuyAlone, onBuyWithCart, productName }: BuyConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative animate-fade-in">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X size={20} />
                </button>

                <div className="p-6 text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Como você deseja comprar?</h3>
                    <p className="text-gray-600 mb-6">
                        Você já possui itens no seu carrinho. Deseja incluir <strong>"{productName}"</strong> junto com eles ou comprar apenas este item agora?
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onBuyWithCart}
                            className="w-full bg-red-100 text-red-700 font-bold py-3 rounded-md hover:bg-red-200 transition flex items-center justify-center gap-2"
                        >
                            <ShoppingCart size={18} />
                            Comprar junto com o carrinho
                        </button>

                        <button
                            onClick={onBuyAlone}
                            className="w-full bg-red-600 text-white font-bold py-3 rounded-md hover:bg-red-700 transition flex items-center justify-center gap-2"
                        >
                            <CreditCard size={18} />
                            Comprar apenas este item
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
