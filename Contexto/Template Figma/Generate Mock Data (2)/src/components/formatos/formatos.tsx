import { useState } from 'react';
import { FileText, FileCheck, ShoppingBag } from 'lucide-react';
import { Card } from '../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { CotizacionFormato } from './cotizacion-formato';
import { ProformaFormato } from './proforma-formato';
import { OrdenFormato } from './orden-formato';

export function Formatos() {
  const [activeTab, setActiveTab] = useState('cotizacion');

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-3xl tracking-tight">Formatos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona y genera formatos de cotización, proforma y orden de compra
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Card className="glass p-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 gap-1 bg-transparent p-0">
            <TabsTrigger 
              value="cotizacion" 
              className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Cotización</span>
            </TabsTrigger>
            <TabsTrigger 
              value="proforma"
              className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <FileCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Proforma</span>
            </TabsTrigger>
            <TabsTrigger 
              value="orden"
              className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Orden de Compra</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cotizacion" className="mt-6">
            <CotizacionFormato />
          </TabsContent>

          <TabsContent value="proforma" className="mt-6">
            <ProformaFormato />
          </TabsContent>

          <TabsContent value="orden" className="mt-6">
            <OrdenFormato />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
