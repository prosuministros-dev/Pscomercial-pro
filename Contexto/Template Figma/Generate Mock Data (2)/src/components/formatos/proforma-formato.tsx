import { useState, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Download, Plus, Trash2, Eye, Loader2 } from 'lucide-react';
import { Separator } from '../ui/separator';
import { toast } from 'sonner';
import html2pdf from 'html2pdf.js';
import logo from 'figma:asset/4bdd7f343c57ce38c8e0eb144768f690c100f5d8.png';

interface ItemProforma {
  id: string;
  codigo: string;
  noParte: string;
  descripcion: string;
  cantidad: number;
  valorUnitario: number;
  valorTotal: number;
}

export function ProformaFormato() {
  const [noProforma, setNoProforma] = useState('2025-024484-1');
  const [fecha, setFecha] = useState('30/12/2025');
  
  // Cliente
  const [cliente, setCliente] = useState('MOTA - ENGIL COLOMBIA S.A.S.');
  const [nit, setNit] = useState('800413315');
  const [telefono, setTelefono] = useState('6014824421');
  const [direccion, setDireccion] = useState('CL 81 11 68');
  const [ciudad, setCiudad] = useState('BOGOTA');
  const [vendedor, setVendedor] = useState('DANIEL FELIPE VALBUENA E');
  const [trm, setTrm] = useState('');
  const [pedido, setPedido] = useState('');
  const [oc, setOc] = useState('');
  
  // Condiciones
  const [condicionPago, setCondicionPago] = useState('Anticipado Clientes Nacionales');
  
  // Items
  const [items, setItems] = useState<ItemProforma[]>([
    {
      id: '1',
      codigo: '',
      noParte: '21KT000NLM',
      descripcion: 'THINKPAD P16S GEN 3 (16" INTEL) LAPTOP\nPROCESOR: INTEL CORE I5 TM 155H ( 16-CORE P-CORE 1.4 GHz / 5.0 GHz BOOST / 24 MB CACHE ) ( 16 CORE E.CORE 2.8 GHz / 4.5 GHz E-CORE BOOST / 12 MB ) | NPU 3.8 GHZU LPE-Core 2.8 GHz ( Gfx, Media, Display, Pch, 24 MB ) | NPU RAM: 32 GB ( 16GB Soldado + 16 GB DIMM ) SO-DIMM DDR5 - 5600 MHz DISCO DURO: SSD 512 GB M.2 2280 NVME PCIe Gen 4 PANTALLA: 16" WQXGA (2560X1600) IPS PANEL ANTIREFLEJO / TOUCH 400 NITS TARJETA GRÁFICA: NVIDIA RTX 500 ADA GENERATION LAPTOP GPU 4GB GDDR6\nHDMI WEBCAM: FHD 1080P + IR CON TAPA DE PRIVACIDAD COLOR: BLACK WWAN READY TECLADO RETROILUMINADO ESPAÑOL BATERÍA 4 CELDAS 86.6 WH ADAPTADOR AC DE 48 GB ( 891 GB62 TB M.2 2280 | Ampliación RAM/SSD',
      cantidad: 5,
      valorUnitario: 1810.15,
      valorTotal: 9050.75
    }
  ]);

  const [moneda, setMoneda] = useState('USD');

  const formatCurrency = (value: number, curr: string = moneda) => {
    return `${curr} ${new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)}`;
  };

  const calcularTotales = () => {
    const totalBruto = items.reduce((acc, item) => acc + item.valorTotal, 0);
    const iva = totalBruto * 0.19;
    const totalPagar = totalBruto + iva;
    return { totalBruto, iva, totalPagar };
  };

  const { totalBruto, iva, totalPagar } = calcularTotales();

  const agregarItem = () => {
    const nuevoItem: ItemProforma = {
      id: Date.now().toString(),
      codigo: '',
      noParte: '',
      descripcion: '',
      cantidad: 1,
      valorUnitario: 0,
      valorTotal: 0
    };
    setItems([...items, nuevoItem]);
  };

  const eliminarItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const actualizarItem = (id: string, campo: keyof ItemProforma, valor: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const itemActualizado = { ...item, [campo]: valor };
        // Recalcular valor total
        if (campo === 'valorUnitario' || campo === 'cantidad') {
          itemActualizado.valorTotal = itemActualizado.valorUnitario * itemActualizado.cantidad;
        }
        return itemActualizado;
      }
      return item;
    }));
  };

  const numeroALetras = (numero: number): string => {
    // Simplificación - en producción usarías una librería
    const partes = numero.toFixed(2).split('.');
    const entero = parseInt(partes[0]);
    const decimales = partes[1];
    
    if (moneda === 'USD') {
      return `${entero.toLocaleString('es-CO')} DOLARES CON ${decimales} CENTAVOS DE DÓLAR`;
    } else {
      return `${entero.toLocaleString('es-CO')} PESOS CON ${decimales} CENTAVOS`;
    }
  };

  const cardRef = useRef<HTMLDivElement>(null);

  const generarPDF = () => {
    const element = cardRef.current;
    if (element) {
      const opt = {
        margin: [15, 15, 15, 15],
        filename: `Proforma_${noProforma}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 1200
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden PDF Template - Pure HTML with inline styles, NO Tailwind */}
      <div style={{ display: 'none' }}>
        <div ref={cardRef} style={{ 
          width: '210mm', 
          minHeight: '297mm', 
          backgroundColor: '#ffffff',
          padding: '20px',
          color: '#000000',
          fontFamily: 'Arial, sans-serif',
          boxSizing: 'border-box'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <div>
              <img src={logo} alt="Prosuministros" style={{ height: '45px', marginBottom: '10px' }} />
              <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
                <p style={{ fontWeight: '600', margin: '2px 0' }}>PROSUMINISTROS DE COLOMBIA S.A.S</p>
                <p style={{ margin: '2px 0' }}>NIT: 900.692.169-9</p>
                <p style={{ margin: '2px 0' }}>CALLE 25C Bis No. 73B - 63</p>
                <p style={{ margin: '2px 0' }}>BOGOTÁ - COLOMBIA</p>
              </div>
            </div>
            
            <div style={{ 
              border: '2px solid #00C8CF', 
              borderRadius: '8px', 
              padding: '15px 25px',
              backgroundColor: '#E6F9FA',
              minWidth: '180px'
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 6px 0' }}>PROFORMA</h2>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#00C8CF', margin: '0' }}>{noProforma}</p>
              <p style={{ fontSize: '10px', color: '#6b7280', margin: '6px 0 0 0' }}>Fecha: {fecha}</p>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #d1d5db', margin: '12px 0' }} />

          {/* Cliente Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>Cliente</p>
              <p style={{ fontSize: '11px', margin: '0', fontWeight: '600' }}>{cliente}</p>
            </div>
            <div>
              <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>NIT</p>
              <p style={{ fontSize: '11px', margin: '0' }}>{nit}</p>
            </div>
            <div>
              <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>Teléfono</p>
              <p style={{ fontSize: '11px', margin: '0' }}>{telefono}</p>
            </div>
            <div>
              <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>Dirección</p>
              <p style={{ fontSize: '11px', margin: '0' }}>{direccion}</p>
            </div>
            <div>
              <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>Ciudad</p>
              <p style={{ fontSize: '11px', margin: '0' }}>{ciudad}</p>
            </div>
            <div>
              <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>Vendedor</p>
              <p style={{ fontSize: '11px', margin: '0' }}>{vendedor}</p>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #d1d5db', margin: '10px 0' }} />

          {/* Condiciones adicionales */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>TRM</p>
              <p style={{ fontSize: '11px', margin: '0' }}>{trm || 'N/A'}</p>
            </div>
            <div>
              <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>Pedido</p>
              <p style={{ fontSize: '11px', margin: '0' }}>{pedido || 'N/A'}</p>
            </div>
            <div>
              <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>OC</p>
              <p style={{ fontSize: '11px', margin: '0' }}>{oc || 'N/A'}</p>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #d1d5db', margin: '10px 0' }} />

          {/* Items */}
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Detalle de Productos</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #d1d5db' }}>
                  <th style={{ textAlign: 'left', padding: '6px 4px', backgroundColor: '#f9fafb', width: '8%' }}>Código</th>
                  <th style={{ textAlign: 'left', padding: '6px 4px', backgroundColor: '#f9fafb', width: '12%' }}>No. Parte</th>
                  <th style={{ textAlign: 'left', padding: '6px 4px', backgroundColor: '#f9fafb' }}>Descripción</th>
                  <th style={{ textAlign: 'right', padding: '6px 4px', backgroundColor: '#f9fafb', width: '8%' }}>Cantidad</th>
                  <th style={{ textAlign: 'right', padding: '6px 4px', backgroundColor: '#f9fafb', width: '12%' }}>Valor Unitario</th>
                  <th style={{ textAlign: 'right', padding: '6px 4px', backgroundColor: '#f9fafb', width: '12%' }}>Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '6px 4px', verticalAlign: 'top' }}>{item.codigo}</td>
                    <td style={{ padding: '6px 4px', verticalAlign: 'top', fontWeight: '600' }}>{item.noParte}</td>
                    <td style={{ padding: '6px 4px', whiteSpace: 'pre-wrap', verticalAlign: 'top', fontSize: '8px', lineHeight: '1.3' }}>{item.descripcion}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', verticalAlign: 'top' }}>{item.cantidad}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', verticalAlign: 'top' }}>${item.valorUnitario.toFixed(2)}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: '600', verticalAlign: 'top' }}>${item.valorTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #d1d5db', margin: '10px 0' }} />

          {/* Totales */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <div style={{ width: '280px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ fontWeight: 'bold', fontSize: '13px' }}>TOTAL</span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#00C8CF' }}>${totalPagar.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #d1d5db', margin: '10px 0' }} />

          {/* Condición de pago */}
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>Condición de Pago</p>
            <p style={{ fontSize: '12px', margin: '0' }}>{condicionPago}</p>
          </div>

          {/* Observaciones */}
          <div style={{ 
            backgroundColor: '#fef3c7', 
            borderRadius: '6px', 
            padding: '10px', 
            fontSize: '9px',
            lineHeight: '1.4',
            marginBottom: '12px',
            border: '1px solid #fbbf24'
          }}>
            <p style={{ margin: '0' }}>
              <span style={{ fontWeight: '600' }}>OBSERVACIONES:</span> LA FACTURA SE REALIZARÁ EN PESOS CON LA TRM DEL DÍA DE FACTURACIÓN
            </p>
          </div>

          {/* Disclaimer */}
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <p style={{ fontSize: '10px', color: '#6b7280', fontStyle: 'italic', margin: '0' }}>No válido como factura</p>
          </div>

          {/* Firmas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '8px', textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#6b7280', margin: '0' }}>Elaborado por</p>
            </div>
            <div style={{ borderTop: '1px solid #000', paddingTop: '8px', textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#6b7280', margin: '0' }}>Firma Recibido</p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Card */}
      <Card className="glass overflow-hidden" ref={cardRef}>
        <div className="p-8 space-y-8 bg-background/50">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-2">
              <img src={logo} alt="Prosuministros" className="h-12 w-auto mb-2" />
              <div>
                <p className="text-xs text-muted-foreground">PROSUMINISTROS DE COLOMBIA S.A.S</p>
                <p className="text-xs text-muted-foreground">NIT: 900.692.169-9</p>
                <p className="text-xs text-muted-foreground">CALLE 25C Bis No. 73B - 63</p>
                <p className="text-xs text-muted-foreground">BOGOTÁ - COLOMBIA</p>
              </div>
            </div>
            
            <div className="bg-muted/50 rounded-lg px-6 py-4 border border-border">
              <div className="space-y-1">
                <h2 className="text-xl tracking-tight">PROFORMA</h2>
                <p className="text-2xl tracking-tight text-primary">{noProforma}</p>
                <p className="text-xs text-muted-foreground mt-2">Fecha de Proforma: {fecha}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Cliente Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Cliente</Label>
              <p className="text-sm mt-1">{cliente}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">NIT</Label>
              <p className="text-sm mt-1">{nit}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Teléfono</Label>
              <p className="text-sm mt-1">{telefono}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Dirección</Label>
              <p className="text-sm mt-1">{direccion}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Vendedor</Label>
              <p className="text-sm mt-1">{vendedor}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Ciudad</Label>
              <p className="text-sm mt-1">{ciudad}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">TRM</Label>
              <p className="text-sm mt-1">{trm || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Pedido</Label>
              <p className="text-sm mt-1">{pedido || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">OC</Label>
              <p className="text-sm mt-1">{oc || 'N/A'}</p>
            </div>
          </div>

          <Separator />

          {/* Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="tracking-tight">Detalle de Productos</h3>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={agregarItem}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Agregar Item
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs text-muted-foreground p-2 font-medium">Código</th>
                    <th className="text-left text-xs text-muted-foreground p-2 font-medium">No. Parte</th>
                    <th className="text-left text-xs text-muted-foreground p-2 font-medium">Descripción</th>
                    <th className="text-right text-xs text-muted-foreground p-2 font-medium">Cantidad</th>
                    <th className="text-right text-xs text-muted-foreground p-2 font-medium">Valor Unitario</th>
                    <th className="text-right text-xs text-muted-foreground p-2 font-medium">Valor Total</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-border/50">
                      <td className="p-2">
                        <Input 
                          value={item.codigo}
                          onChange={(e) => actualizarItem(item.id, 'codigo', e.target.value)}
                          className="h-8 text-xs"
                          placeholder="Código"
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          value={item.noParte}
                          onChange={(e) => actualizarItem(item.id, 'noParte', e.target.value)}
                          className="h-8 text-xs"
                          placeholder="No. Parte"
                        />
                      </td>
                      <td className="p-2">
                        <Textarea 
                          value={item.descripcion}
                          onChange={(e) => actualizarItem(item.id, 'descripcion', e.target.value)}
                          className="min-h-[100px] text-xs resize-none"
                          placeholder="Descripción detallada del producto"
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => actualizarItem(item.id, 'cantidad', parseInt(e.target.value) || 0)}
                          className="h-8 text-xs text-right w-24"
                          min="1"
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number"
                          value={item.valorUnitario}
                          onChange={(e) => actualizarItem(item.id, 'valorUnitario', parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs text-right"
                          step="0.01"
                        />
                      </td>
                      <td className="p-2 text-right text-xs">
                        {formatCurrency(item.valorTotal)}
                      </td>
                      <td className="p-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => eliminarItem(item.id)}
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator />

          {/* Totales */}
          <div className="flex justify-end">
            <div className="w-full md:w-96 space-y-2">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Total Bruto</span>
                <span className="text-sm">{formatCurrency(totalBruto)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">IVA Tarifa 19%</span>
                <span className="text-sm">{formatCurrency(iva)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="tracking-tight">Total a Pagar</span>
                <span className="text-2xl text-primary tracking-tight">{formatCurrency(totalPagar)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Condiciones */}
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">CONDICIÓN DE PAGO</Label>
              <p className="text-sm mt-1">{condicionPago}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">VALOR EN LETRAS</Label>
              <p className="text-sm mt-1 uppercase">{numeroALetras(totalPagar)}</p>
            </div>
          </div>

          {/* Observaciones */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
            <p className="text-xs">
              <span className="font-medium">OBSERVACIONES:</span>
              <br />
              LA FACTURA SE REALIZARÁ EN PESOS CON LA TRM DEL DÍA DE FACTURACIÓN
            </p>
          </div>

          {/* Disclaimer */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground italic">No válido como factura</p>
          </div>

          {/* Firmas */}
          <div className="grid grid-cols-2 gap-8 pt-8">
            <div className="border-t border-border pt-4 text-center">
              <p className="text-xs text-muted-foreground">Elaborado por</p>
            </div>
            <div className="border-t border-border pt-4 text-center">
              <p className="text-xs text-muted-foreground">Firma Recibido</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button className="gap-2 flex-1" size="lg">
          <Eye className="h-4 w-4" />
          Vista Previa PDF
        </Button>
        <Button variant="outline" className="gap-2 flex-1" size="lg" onClick={generarPDF}>
          <Download className="h-4 w-4" />
          Descargar PDF
        </Button>
      </div>
    </div>
  );
}