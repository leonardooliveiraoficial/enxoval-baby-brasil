import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  CreditCard,
  Package,
  ShoppingCart,
  Tags,
  FileText,
  Settings,
  Baby,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: BarChart3,
    exact: true,
  },
  {
    title: "Transações",
    url: "/admin/transactions",
    icon: CreditCard,
  },
  {
    title: "Pedidos",
    url: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    title: "Produtos",
    url: "/admin/products",
    icon: Package,
  },
  {
    title: "Categorias",
    url: "/admin/categories",
    icon: Tags,
  },
  {
    title: "Conteúdos",
    url: "/admin/content",
    icon: FileText,
  },
  {
    title: "Configurações",
    url: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  
  const collapsed = state === 'collapsed';

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return currentPath === path;
    }
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  return (
    <Sidebar 
      className={collapsed ? "w-14" : "w-64"} 
      collapsible="icon"
      side="left"
    >
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-baby-blue to-soft-pink p-2 rounded-lg">
              <Baby className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-baby-blue">Admin</h2>
              <p className="text-xs text-muted-foreground">Painel Administrativo</p>
            </div>
          </div>
        )}
        <SidebarTrigger />
      </div>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive: navIsActive }) =>
                        cn(
                          "flex items-center space-x-3 py-2 px-3 rounded-lg transition-colors",
                          (navIsActive && item.exact) || 
                          (!item.exact && isActive(item.url))
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )
                      }
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}