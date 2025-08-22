import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Home, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminHeader = () => {
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <SidebarTrigger />
          </div>
          
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Painel Administrativo
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie seu chá de bebê
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/" className="flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span>Ver Site</span>
            </Link>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user?.email}</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {profile?.role === 'admin' ? 'Administrador' : 'Visualizador'}
                  </p>
                </div>
              </div>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem disabled>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};