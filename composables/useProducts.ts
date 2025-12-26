import type { Database } from '~/types/database.types'

type Product = Database['public']['Tables']['products']['Row']
type ProductWithCategory = Product & {
  categories: { name: string; slug: string } | null
}

export const useProducts = () => {
  const client = useSupabaseClient<Database>()
  
  const products = ref<ProductWithCategory[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchProducts = async (categorySlug?: string) => {
    loading.value = true
    error.value = null
    try {
      let query = client.from('products').select(`
        *,
        categories (
          name,
          slug
        )
      `).eq('is_active', true)

      if (categorySlug) {
        // First get category ID - use maybeSingle() to handle not found gracefully
        const { data: cat } = await client
          .from('categories')
          .select('id')
          .eq('slug', categorySlug)
          .maybeSingle()
        
        if (cat) {
          query = query.eq('category_id', cat.id)
        }
      }

      const { data, error: err } = await query.order('created_at', { ascending: false })

      if (err) throw err
      products.value = (data as ProductWithCategory[]) || []
    } catch (e: any) {
      error.value = e.message
      products.value = []
    } finally {
      loading.value = false
    }
  }

  const fetchProduct = async (slug: string): Promise<ProductWithCategory | null> => {
    loading.value = true
    error.value = null
    try {
      // Use maybeSingle() instead of single() to prevent 
      // "Cannot coerce result to single JSON object" error when no product found
      const { data, error: err } = await client.from('products')
        .select(`
          *,
          categories (
             name,
             slug
          )
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle()
      
      if (err) throw err
      return data as ProductWithCategory | null
    } catch (e: any) {
      error.value = e.message
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    products,
    loading,
    error,
    fetchProducts,
    fetchProduct
  }
}
