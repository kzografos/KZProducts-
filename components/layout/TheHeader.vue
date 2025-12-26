<script setup lang="ts">
import { User, Search, Menu, Sparkles, ChevronDown, Cpu, MonitorSpeaker, MemoryStick, HardDrive } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '~/components/ui/sheet'
import type { Database } from '~/types/database.types'

const user = useSupabaseUser()
const client = useSupabaseClient<Database>()
const router = useRouter()

const searchQuery = ref('')
const isScrolled = ref(false)
const categories = ref<Database['public']['Tables']['categories']['Row'][]>([])

// Category icon mapping
const categoryIcons: Record<string, any> = {
  cpu: Cpu,
  gpu: MonitorSpeaker,
  ram: MemoryStick,
  ssd: HardDrive,
  storage: HardDrive,
}

// Fetch categories from Supabase
onMounted(async () => {
  const handleScroll = () => {
    isScrolled.value = window.scrollY > 10
  }
  window.addEventListener('scroll', handleScroll)
  onUnmounted(() => window.removeEventListener('scroll', handleScroll))
  
  // Fetch categories
  const { data } = await client
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
  
  if (data) categories.value = data
})

const handleLogout = async () => {
  await client.auth.signOut()
  router.push('/auth/login')
}

const handleSearch = () => {
  if (searchQuery.value) {
    router.push({ path: '/products', query: { q: searchQuery.value } })
  }
}

const getIcon = (slug: string) => categoryIcons[slug] || Cpu
</script>

<template>
  <header 
    class="sticky top-0 z-50 w-full transition-all duration-300"
    :class="[
      isScrolled 
        ? 'bg-background/70 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/5' 
        : 'bg-background/50 backdrop-blur-md border-b border-transparent'
    ]"
  >
    <!-- Glassmorphism gradient overlay -->
    <div class="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
    
    <div class="container relative flex h-16 items-center">
      <!-- Mobile Menu -->
      <Sheet>
        <SheetTrigger as-child>
          <Button variant="ghost" class="mr-2 px-0 text-base hover:bg-white/10 focus-visible:bg-white/10 focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden">
            <Menu class="h-6 w-6" />
            <span class="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" class="pr-0 bg-background/95 backdrop-blur-xl border-r border-white/10">
          <nav class="flex flex-col space-y-4">
            <NuxtLink to="/" class="flex items-center gap-2 text-lg font-bold">
              <Sparkles class="h-5 w-5 text-primary" />
              KZProducts
            </NuxtLink>
            <NuxtLink to="/products" class="transition-colors hover:text-primary">Products</NuxtLink>
            <div class="space-y-2">
              <span class="text-sm text-muted-foreground">Categories</span>
              <div class="flex flex-col space-y-1 pl-2">
                <NuxtLink 
                  v-for="cat in categories" 
                  :key="cat.id"
                  :to="`/categories/${cat.slug}`" 
                  class="flex items-center gap-2 py-1 transition-colors hover:text-primary"
                >
                  <component :is="getIcon(cat.slug)" class="h-4 w-4" />
                  {{ cat.name }}
                </NuxtLink>
              </div>
            </div>
            <NuxtLink to="/about" class="transition-colors hover:text-primary">About</NuxtLink>
            <NuxtLink to="/contact" class="transition-colors hover:text-primary">Contact</NuxtLink>
          </nav>
        </SheetContent>
      </Sheet>

      <!-- Logo -->
      <div class="mr-4 hidden md:flex">
        <NuxtLink to="/" class="mr-6 flex items-center space-x-2 group">
          <div class="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <Sparkles class="h-5 w-5 text-primary" />
          </div>
          <span class="hidden font-bold sm:inline-block bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            KZProducts
          </span>
        </NuxtLink>
        <nav class="flex items-center space-x-1 text-sm font-medium">
          <NuxtLink 
            to="/products" 
            class="px-3 py-2 rounded-lg transition-all hover:bg-white/10 hover:text-foreground text-foreground/60"
          >
            Products
          </NuxtLink>
          
          <!-- Categories Dropdown -->
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button 
                variant="ghost" 
                class="px-3 py-2 h-auto text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-white/10"
              >
                Categories
                <ChevronDown class="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" class="w-56 bg-background/95 backdrop-blur-xl border-white/10">
              <DropdownMenuLabel>Shop by Category</DropdownMenuLabel>
              <DropdownMenuSeparator class="bg-white/10" />
              <DropdownMenuItem 
                v-for="cat in categories" 
                :key="cat.id"
                @click="router.push(`/categories/${cat.slug}`)"
                class="cursor-pointer focus:bg-white/10"
              >
                <component :is="getIcon(cat.slug)" class="mr-2 h-4 w-4 text-primary" />
                {{ cat.name }}
              </DropdownMenuItem>
              <DropdownMenuSeparator class="bg-white/10" />
              <DropdownMenuItem @click="router.push('/categories')" class="cursor-pointer focus:bg-white/10">
                View All Categories
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <NuxtLink 
            to="/about" 
            class="px-3 py-2 rounded-lg transition-all hover:bg-white/10 hover:text-foreground text-foreground/60"
          >
            About
          </NuxtLink>
        </nav>
      </div>

      <!-- Search & Actions -->
      <div class="flex flex-1 items-center justify-between space-x-2 md:justify-end">
        <div class="w-full flex-1 md:w-auto md:flex-none">
          <div class="relative group">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              v-model="searchQuery"
              type="search"
              placeholder="Search products..."
              class="pl-9 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 transition-all"
              @keyup.enter="handleSearch"
            />
          </div>
        </div>
        <nav class="flex items-center space-x-1">
          <!-- Cart Sheet -->
          <CartSheet />

          <!-- User Menu -->
          <DropdownMenu v-if="user">
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="icon" class="hover:bg-white/10">
                <User class="h-5 w-5" />
                <span class="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="bg-background/95 backdrop-blur-xl border-white/10">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator class="bg-white/10" />
              <DropdownMenuItem @click="router.push('/account')" class="focus:bg-white/10">
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem @click="router.push('/account/orders')" class="focus:bg-white/10">
                Orders
              </DropdownMenuItem>
              <DropdownMenuSeparator class="bg-white/10" />
              <DropdownMenuItem @click="handleLogout" class="focus:bg-white/10 text-destructive">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <!-- Login Button -->
          <Button 
            v-else 
            size="sm" 
            class="bg-primary/90 hover:bg-primary shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all" 
            as-child
          >
            <NuxtLink to="/auth/login">Login</NuxtLink>
          </Button>
        </nav>
      </div>
    </div>
  </header>
</template>
