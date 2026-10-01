import { notFound } from 'next/navigation';
import { getProductBySlug, getProducts } from '@/lib/data';
import { ProductDetailView } from '@/components/ProductDetailView';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: 'Product Not Found — Aroma Deluz' };
  }

  return {
    title: `${product.name} — Luxury ${product.category === 'candle' ? 'Scented Candle' : 'Perfume'} | Aroma Deluz`,
    description: product.description || `Handcrafted ${product.name} from the ${product.collection} collection.`,
    openGraph: {
      images: [product.image_url || '/product-lamour.jpg'],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Fetch related products from the same collection or category
  const allProducts = await getProducts({ collection: product.collection || undefined });
  const relatedProducts = allProducts.filter(p => p.id !== product.id);

  return (
    <div className="min-h-screen bg-cream">
      <ProductDetailView product={product} relatedProducts={relatedProducts} />
    </div>
  );
}
