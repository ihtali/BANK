import { Link, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, ArrowLeftRight, Shield, Home, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onLogout: () => void;
  userEmail?: string | null;
}

export function Navbar({ onLogout, userEmail }: NavbarProps) {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/transfer', label: 'Transfer', icon: ArrowLeftRight },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-emerald-500/20 bg-emerald-950/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border border-emerald-500/40 shadow-lg shadow-emerald-900/20 group-hover:shadow-emerald-900/30 transition-all duration-300">
              <Shield className="h-5 w-5 text-emerald-200" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold bg-gradient-to-r from-emerald-200 to-teal-200 bg-clip-text text-transparent">
                SecureBank
              </span>
              <span className="text-xs text-emerald-300/70 font-medium">Premium Banking</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group/nav',
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-100 border border-emerald-500/30 shadow-md shadow-emerald-900/20'
                      : 'text-emerald-200/70 hover:text-emerald-100 hover:bg-emerald-900/30 hover:border hover:border-emerald-500/20'
                  )}
                >
                  <div className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    isActive 
                      ? 'bg-emerald-500/30 text-emerald-200' 
                      : 'bg-emerald-500/10 text-emerald-300/70 group-hover/nav:bg-emerald-500/20 group-hover/nav:text-emerald-200'
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="hidden sm:block">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-4">
            {userEmail && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-900/30 border border-emerald-500/20">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-sm text-emerald-200 truncate max-w-[200px]">
                  {userEmail}
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-emerald-200/70 hover:text-emerald-100 hover:bg-emerald-900/30 border border-emerald-500/20 rounded-lg px-3 py-2 transition-all duration-300 group/logout"
            >
              <div className="flex items-center gap-2">
                <LogOut className="h-4 w-4 group-hover/logout:text-red-400 transition-colors" />
                <span className="hidden sm:block text-sm font-medium">Logout</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Decorative line */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
    </nav>
  );
}
// import { Link, useLocation } from 'react-router-dom';
// import { LogOut, LayoutDashboard, ArrowLeftRight, Shield } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { cn } from '@/lib/utils';

// interface NavbarProps {
//   onLogout: () => void;
//   userEmail?: string | null;
// }

// export function Navbar({ onLogout, userEmail }: NavbarProps) {
//   const location = useLocation();

//   const navItems = [
//     { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
//     { path: '/transfer', label: 'Transfer', icon: ArrowLeftRight },
//   ];

//   return (
//     <nav className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
//       <div className="container mx-auto px-4">
//         <div className="flex h-16 items-center justify-between">
//           {/* Logo */}
//           <Link to="/dashboard" className="flex items-center gap-2 group">
//             <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary shadow-sm group-hover:shadow-button transition-shadow">
//               <Shield className="h-5 w-5 text-primary-foreground" />
//             </div>
//             <span className="text-lg font-semibold text-foreground hidden sm:block">
//               SecureBank
//             </span>
//           </Link>

//           {/* Navigation Links */}
//           <div className="flex items-center gap-1">
//             {navItems.map((item) => {
//               const Icon = item.icon;
//               const isActive = location.pathname === item.path;
              
//               return (
//                 <Link
//                   key={item.path}
//                   to={item.path}
//                   className={cn(
//                     'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
//                     isActive
//                       ? 'bg-accent text-accent-foreground'
//                       : 'text-muted-foreground hover:text-foreground hover:bg-muted'
//                   )}
//                 >
//                   <Icon className="h-4 w-4" />
//                   <span className="hidden sm:block">{item.label}</span>
//                 </Link>
//               );
//             })}
//           </div>

//           {/* User Info & Logout */}
//           <div className="flex items-center gap-4">
//             {userEmail && (
//               <span className="text-sm text-muted-foreground hidden md:block truncate max-w-[200px]">
//                 {userEmail}
//               </span>
//             )}
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={onLogout}
//               className="text-muted-foreground hover:text-destructive"
//             >
//               <LogOut className="h-4 w-4" />
//               <span className="hidden sm:block">Logout</span>
//             </Button>
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// }
