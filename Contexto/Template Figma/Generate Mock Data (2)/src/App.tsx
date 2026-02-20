import { useState } from 'react';
import { ThemeProvider } from './components/theme-provider';
import { Navigation } from './components/layout/navigation';
import { Dashboard } from './components/dashboard/dashboard';
import { Leads } from './components/leads/leads';
import { Cotizaciones } from './components/cotizaciones/cotizaciones';
import { Pedidos } from './components/pedidos/pedidos';
import { PedidosNuevo } from './components/pedidos-nuevo';
import { AdminPanel } from './components/admin/admin-panel';
import { WhatsAppPanel } from './components/whatsapp/whatsapp-panel';
import { Financiero } from './components/financiero/financiero';
import { Formatos } from './components/formatos/formatos';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'leads':
        return <Leads />;
      case 'cotizaciones':
        return <Cotizaciones />;
      case 'pedidos':
        return <PedidosNuevo />; // Usando el nuevo módulo
      case 'financiero':
        return <Financiero />;
      case 'formatos':
        return <Formatos />;
      case 'whatsapp':
        return <WhatsAppPanel />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation currentView={currentView} onViewChange={setCurrentView} />
        
        {/* Padding superior aumentado para móvil: pt-36 (144px) para dar espacio al header + menú móvil */}
        <main className="flex-1 w-full px-3 pt-36 pb-4 md:pt-20 md:px-6 lg:px-8 overflow-auto">
          <div className="h-full w-full max-w-[1400px] mx-auto">
            {renderView()}
          </div>
        </main>

        <Toaster />
      </div>
    </ThemeProvider>
  );
}