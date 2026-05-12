import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Shield,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { NavLink } from "@/components/NavLink";
import { auth } from "@/lib/firebase";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Inversionistas", url: "/inversionistas", icon: Users },
  { title: "Contratos", url: "/contratos", icon: FileText },
  { title: "Pagos", url: "/pagos", icon: CreditCard },
];

export function AppSidebar() {
  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <TrendingUp className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-sidebar-accent-foreground tracking-wide">
            HGH
          </span>
          <span className="text-[10px] text-sidebar-foreground/60 leading-tight">
            Administrador de Inversiones Inmobiliarias
          </span>
        </div>
      </div>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 px-3 mb-2">
            Módulos
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="mt-auto border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent">
            <Shield className="h-4 w-4 text-sidebar-accent-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-sidebar-accent-foreground">
              Administrador
            </span>
            <span className="text-[10px] text-sidebar-foreground/50">
              Sesión activa
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-md border border-sidebar-border px-3 py-2 text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Cerrar sesión
        </button>
      </div>
    </Sidebar>
  );
}
