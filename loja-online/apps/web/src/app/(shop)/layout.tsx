import { Header } from '@/components/header/Header';

export default function ShopLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-white">
            <Header />
            <main>
                {children}
            </main>
            {/* Footer can go here later */}
            <footer className="mt-20 py-10 border-t border-gray-200">
                <div className="container mx-auto px-4">
                    <p className="text-sm text-gray-600">@Copyright</p>
                </div>
            </footer>
        </div>
    );
}
