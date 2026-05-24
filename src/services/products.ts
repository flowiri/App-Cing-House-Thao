import { Product } from '../types';
import { supabase } from '../lib/supabase';

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  category: string;
  category_name: string;
  price: number;
  currency: string;
  status: 'active' | 'inactive';
  image: string;
};

const productColumns = 'id, sku, name, category, category_name, price, currency, status, image';

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category,
    categoryName: row.category_name,
    price: Number(row.price),
    currency: row.currency,
    status: row.status,
    image: row.image
  };
}

function toProductRow(product: Product): ProductRow {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    category: product.category,
    category_name: product.categoryName,
    price: product.price,
    currency: product.currency,
    status: product.status,
    image: product.image
  };
}

export async function loadProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(productColumns)
    .order('name', { ascending: true });

  if (error) throw error;

  return ((data ?? []) as ProductRow[]).map(toProduct);
}

export async function seedProductsIfEmpty(initialProducts: Product[]): Promise<Product[]> {
  const existingProducts = await loadProducts();

  if (existingProducts.length > 0) {
    return existingProducts;
  }

  const { data, error } = await supabase
    .from('products')
    .insert(initialProducts.map(toProductRow))
    .select(productColumns);

  if (error) throw error;

  return ((data ?? []) as ProductRow[]).map(toProduct);
}

export async function createProduct(product: Product): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert(toProductRow(product))
    .select(productColumns)
    .single();

  if (error) throw error;

  return toProduct(data as ProductRow);
}

export async function updateProduct(product: Product): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update(toProductRow(product))
    .eq('id', product.id)
    .select(productColumns)
    .single();

  if (error) throw error;

  return toProduct(data as ProductRow);
}

export async function deleteProduct(productId: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) throw error;
}
