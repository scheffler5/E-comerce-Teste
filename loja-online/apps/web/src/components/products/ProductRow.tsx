import { ProductCard } from './ProductCard';

interface ProductRowProps {
    title: string;
    products: any[];
}

export function ProductRow({ title, products }: ProductRowProps) {
    return (
        <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-800 mb-6">{title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((p, i) => (
                    <ProductCard key={i} {...p} />
                ))}
            </div>
        </section>
    );
}
