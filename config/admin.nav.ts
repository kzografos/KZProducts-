import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  BarChart3,
  Tags,
  type LucideIcon
} from 'lucide-vue-next'

export interface AdminNavItem {
  label: string
  icon: LucideIcon
  href: string
  badge?: string | number
}

export interface AdminNavSection {
  title?: string
  items: AdminNavItem[]
}

export const adminNavigation: AdminNavSection[] = [
  {
    items: [
      {
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/admin'
      }
    ]
  },
  {
    title: 'Store',
    items: [
      {
        label: 'Products',
        icon: Package,
        href: '/admin/products'
      },
      {
        label: 'Categories',
        icon: Tags,
        href: '/admin/categories'
      },
      {
        label: 'Orders',
        icon: ShoppingCart,
        href: '/admin/orders'
      }
    ]
  },
  {
    title: 'Customers',
    items: [
      {
        label: 'All Customers',
        icon: Users,
        href: '/admin/customers'
      }
    ]
  },
  {
    title: 'Analytics',
    items: [
      {
        label: 'Reports',
        icon: BarChart3,
        href: '/admin/reports'
      }
    ]
  },
  {
    title: 'System',
    items: [
      {
        label: 'Settings',
        icon: Settings,
        href: '/admin/settings'
      }
    ]
  }
]
