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

interface ItemOrden {
  id: string;
  cantidad: number;
  noParte: string;
  producto: string;
  fechaEntrega: string;
  garantia: string;
  costoUnitario: number;
  iva: number;
  total: number;
}

export function OrdenFormato() {
  const [noOrden, setNoOrden] = useState('0016133');
  const [fecha, setFecha] = useState('2025-12-30');
  
  // Proveedor (a quien va dirigida la orden)
  const [proveedor, setProveedor] = useState('OSAKA ELECTRONICS S.A.S');
  const [nitProveedor, setNitProveedor] = useState('830500205-1');
  const [direccionProveedor, setDireccionProveedor] = useState('Calle 21 No. 8-29');
  const [telefonoProveedor, setTelefonoProveedor] = useState('312 5223625');
  const [ciudadProveedor, setCiudadProveedor] = useState('BOGOTA');
  
  // Condiciones
  const [moneda, setMoneda] = useState('PESOS');
  const [asesor, setAsesor] = useState('ANDRES VALBUENA');
  const [formaPago, setFormaPago] = useState('Anticipado');
  
  // Items
  const [items, setItems] = useState<ItemOrden[]>([
    {
      id: '1',
      cantidad: 2,
      noParte: 'FNX255',
      producto: 'LIMPIADOR ELECTRONICO INDUSTRIAL PHINNIX 450ML',
      fechaEntrega: '2025-12-22',
      garantia: 'N/A',
      costoUnitario: 43529.41,
      iva: 8270.59,
      total: 87058.82
    },
    {
      id: '2',
      cantidad: 1,
      noParte: 'FNX002',
      producto: 'LIMPIADOR DE PANTALLA PHINNIX 250CC',
      fechaEntrega: '2025-12-22',
      garantia: 'N/A',
      costoUnitario: 18907.56,
      iva: 3592.44,
      total: 18907.56
    },
    {
      id: '3',
      cantidad: 2,
      noParte: 'FNX195',
      producto: 'ALCOHOL ISOPROPILICO 400ML PHINNIX',
      fechaEntrega: '2025-12-22',
      garantia: 'N/A',
      costoUnitario: 32605.04,
      iva: 6194.96,
      total: 65210.08
    }
  ]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const calcularTotales = () => {
    const subtotal = items.reduce((acc, item) => acc + (item.costoUnitario * item.cantidad), 0);
    const totalIva = items.reduce((acc, item) => acc + (item.iva * item.cantidad), 0);
    const total = subtotal + totalIva;
    return { subtotal, totalIva, total };
  };

  const { subtotal, totalIva, total: totalFinal } = calcularTotales();

  const agregarItem = () => {
    const nuevoItem: ItemOrden = {
      id: Date.now().toString(),
      cantidad: 1,
      noParte: '',
      producto: '',
      fechaEntrega: new Date().toISOString().split('T')[0],
      garantia: 'N/A',
      costoUnitario: 0,
      iva: 0,
      total: 0
    };
    setItems([...items, nuevoItem]);
  };

  const eliminarItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const actualizarItem = (id: string, campo: keyof ItemOrden, valor: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const itemActualizado = { ...item, [campo]: valor };
        // Recalcular IVA y total
        if (campo === 'costoUnitario' || campo === 'cantidad') {
          const subtotalItem = itemActualizado.costoUnitario * itemActualizado.cantidad;
          itemActualizado.iva = subtotalItem * 0.19;
          itemActualizado.total = subtotalItem + itemActualizado.iva;
        }
        return itemActualizado;
      }
      return item;
    }));
  };

  const pdfRef = useRef<HTMLDivElement>(null);

  const generarPDF = () => {
    const element = pdfRef.current;
    if (element) {
      const opt = {
        margin: [15, 15, 15, 15],
        filename: `orden_${noOrden}.pdf`,
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
        <div ref={pdfRef} style={{ 
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
                <p style={{ fontWeight: '600', margin: '2px 0' }}>PROSUMINISTROS DE COLOMBIA SAS</p>
                <p style={{ margin: '2px 0' }}>NIT: 900692169-9</p>
                <p style={{ margin: '2px 0' }}>Dirección: Calle 25C Bis # 73B-63</p>
                <p style={{ margin: '2px 0' }}>TEL: 6012632892</p>
                <p style={{ margin: '2px 0' }}>Bogotá</p>
              </div>
            </div>
            
            <div style={{ 
              border: '2px solid #00C8CF', 
              borderRadius: '8px', 
              padding: '15px 25px',
              backgroundColor: '#E6F9FA',
              minWidth: '180px'
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#00C8CF', margin: '0 0 6px 0' }}>ORDEN No.</h2>
              <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '0' }}>{noOrden}</p>
              <p style={{ fontSize: '10px', color: '#6b7280', margin: '6px 0 0 0' }}>Fecha: {fecha}</p>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #d1d5db', margin: '12px 0' }} />

          {/* Proveedor Info */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ marginBottom: '10px' }}>
              <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>Señores (Proveedor)</p>
              <p style={{ fontSize: '12px', fontWeight: '600', margin: '0' }}>{proveedor}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>Attn:</p>
                <p style={{ fontSize: '11px', margin: '0' }}>N/A</p>
              </div>
              <div>
                <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>NIT</p>
                <p style={{ fontSize: '11px', margin: '0' }}>{nitProveedor}</p>
              </div>
              <div>
                <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>Ciudad</p>
                <p style={{ fontSize: '11px', margin: '0' }}>{ciudadProveedor}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
              <div>
                <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>Dirección</p>
                <p style={{ fontSize: '11px', margin: '0' }}>{direccionProveedor}</p>
              </div>
              <div>
                <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>Teléfono</p>
                <p style={{ fontSize: '11px', margin: '0' }}>{telefonoProveedor}</p>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #d1d5db', margin: '10px 0' }} />

          {/* Condiciones comerciales */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>Moneda</p>
              <p style={{ fontSize: '11px', margin: '0' }}>{moneda}</p>
            </div>
            <div>
              <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>Asesor</p>
              <p style={{ fontSize: '11px', margin: '0' }}>{asesor}</p>
            </div>
            <div>
              <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>Forma de Pago</p>
              <p style={{ fontSize: '11px', margin: '0' }}>{formaPago}</p>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #d1d5db', margin: '10px 0' }} />

          {/* Items */}
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Detalle de Productos</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #d1d5db' }}>
                  <th style={{ textAlign: 'left', padding: '6px 4px', backgroundColor: '#f9fafb', width: '6%' }}>Cnt.</th>
                  <th style={{ textAlign: 'left', padding: '6px 4px', backgroundColor: '#f9fafb', width: '12%' }}>No de Parte</th>
                  <th style={{ textAlign: 'left', padding: '6px 4px', backgroundColor: '#f9fafb' }}>Producto</th>
                  <th style={{ textAlign: 'left', padding: '6px 4px', backgroundColor: '#f9fafb', width: '10%' }}>Fch.Entr.</th>
                  <th style={{ textAlign: 'left', padding: '6px 4px', backgroundColor: '#f9fafb', width: '8%' }}>Garant.</th>
                  <th style={{ textAlign: 'right', padding: '6px 4px', backgroundColor: '#f9fafb', width: '12%' }}>Costo Unit.</th>
                  <th style={{ textAlign: 'right', padding: '6px 4px', backgroundColor: '#f9fafb', width: '10%' }}>IVA</th>
                  <th style={{ textAlign: 'right', padding: '6px 4px', backgroundColor: '#f9fafb', width: '12%' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '6px 4px', verticalAlign: 'top' }}>{item.cantidad}</td>
                    <td style={{ padding: '6px 4px', verticalAlign: 'top', fontWeight: '600' }}>{item.noParte}</td>
                    <td style={{ padding: '6px 4px', verticalAlign: 'top', fontSize: '9px' }}>{item.producto}</td>
                    <td style={{ padding: '6px 4px', verticalAlign: 'top', fontSize: '9px' }}>{item.fechaEntrega}</td>
                    <td style={{ padding: '6px 4px', verticalAlign: 'top' }}>{item.garantia}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', verticalAlign: 'top' }}>{formatCurrency(item.costoUnitario)}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', verticalAlign: 'top' }}>{formatCurrency(item.iva * item.cantidad)}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: '600', verticalAlign: 'top' }}>{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #d1d5db', margin: '10px 0' }} />

          {/* Totales */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <div style={{ width: '350px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>SUBTOTAL</span>
                <span style={{ fontSize: '12px' }}>{formatCurrency(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>IVA</span>
                <span style={{ fontSize: '12px' }}>{formatCurrency(totalIva)}</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #d1d5db', margin: '6px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ fontWeight: 'bold', fontSize: '13px' }}>TOTAL</span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#00C8CF' }}>{formatCurrency(totalFinal)}</span>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #d1d5db', margin: '10px 0' }} />

          {/* Firma */}
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '12px', marginBottom: '8px' }}>Cordialmente,</p>
            <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
              <p style={{ fontWeight: '600', margin: '3px 0' }}>ANDRÉS VALBUENA C</p>
              <p style={{ color: '#6b7280', margin: '3px 0' }}>DIRECTOR DE COMPRAS</p>
              <p style={{ color: '#6b7280', margin: '3px 0' }}>Teléfono: 6012632892</p>
              <p style={{ color: '#6b7280', margin: '3px 0' }}>Celular: 3005272352</p>
              <p style={{ color: '#00C8CF', margin: '3px 0' }}>compras@prosuministros.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Card */}
      <Card className="glass overflow-hidden">
        <div className="p-8 space-y-8 bg-background/50">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-2">
              <img src={logo} alt="Prosuministros" className="h-12 w-auto mb-2" />
              <div>
                <p className="text-xs">PROSUMINISTROS DE COLOMBIA SAS</p>
                <p className="text-xs text-muted-foreground">NIT: 900692169-9</p>
                <p className="text-xs text-muted-foreground">Dirección: Calle 25C Bis # 73B-63</p>
                <p className="text-xs text-muted-foreground">TEL: 6012632892</p>
                <p className="text-xs text-muted-foreground">Bogotá</p>
              </div>
            </div>
            
            <div className="bg-primary/10 rounded-lg px-6 py-4 border border-primary/20">
              <div className="space-y-1">
                <h2 className="text-2xl tracking-tight text-primary">ORDEN No.</h2>
                <p className="text-3xl tracking-tight">{noOrden}</p>
                <p className="text-xs text-muted-foreground mt-2">Fecha: {fecha}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Proveedor Info */}
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Señores (Proveedor)</Label>
              <p className="text-sm mt-1">{proveedor}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Attn:</Label>
                <p className="text-sm mt-1">N/A</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">NIT</Label>
                <p className="text-sm mt-1">{nitProveedor}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Ciudad</Label>
                <p className="text-sm mt-1">{ciudadProveedor}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Dirección</Label>
                <p className="text-sm mt-1">{direccionProveedor}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Teléfono</Label>
                <p className="text-sm mt-1">{telefonoProveedor}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Condiciones comerciales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Moneda</Label>
              <p className="text-sm mt-1">{moneda}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Asesor</Label>
              <p className="text-sm mt-1">{asesor}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Forma de Pago</Label>
              <p className="text-sm mt-1">{formaPago}</p>
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
                  <tr className="bg-primary/5 border-y border-primary/20">
                    <th className="text-left text-xs text-muted-foreground p-2 font-medium">Cnt.</th>
                    <th className="text-left text-xs text-muted-foreground p-2 font-medium">No de Parte</th>
                    <th className="text-left text-xs text-muted-foreground p-2 font-medium">Producto</th>
                    <th className="text-left text-xs text-muted-foreground p-2 font-medium">Fch.Entr.</th>
                    <th className="text-left text-xs text-muted-foreground p-2 font-medium">Garant.</th>
                    <th className="text-right text-xs text-muted-foreground p-2 font-medium">Costo Unitario</th>
                    <th className="text-right text-xs text-muted-foreground p-2 font-medium">IVA</th>
                    <th className="text-right text-xs text-muted-foreground p-2 font-medium">Total</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-border/50">
                      <td className="p-2">
                        <Input 
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => actualizarItem(item.id, 'cantidad', parseInt(e.target.value) || 0)}
                          className="h-8 text-xs w-16"
                          min="1"
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
                          value={item.producto}
                          onChange={(e) => actualizarItem(item.id, 'producto', e.target.value)}
                          className="min-h-[60px] text-xs resize-none"
                          placeholder="Descripción del producto"
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          type="date"
                          value={item.fechaEntrega}
                          onChange={(e) => actualizarItem(item.id, 'fechaEntrega', e.target.value)}
                          className="h-8 text-xs w-36"
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          value={item.garantia}
                          onChange={(e) => actualizarItem(item.id, 'garantia', e.target.value)}
                          className="h-8 text-xs"
                          placeholder="Garantía"
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number"
                          value={item.costoUnitario}
                          onChange={(e) => actualizarItem(item.id, 'costoUnitario', parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs text-right"
                          step="0.01"
                        />
                      </td>
                      <td className="p-2 text-right text-xs">
                        {formatCurrency(item.iva * item.cantidad)}
                      </td>
                      <td className="p-2 text-right text-xs">
                        {formatCurrency(item.total)}
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
                <span className="text-sm text-muted-foreground">SUBTOTAL</span>
                <span className="text-sm">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">IVA</span>
                <span className="text-sm">{formatCurrency(totalIva)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="tracking-tight">TOTAL</span>
                <span className="text-2xl text-primary tracking-tight">{formatCurrency(totalFinal)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Firma */}
          <div className="space-y-4">
            <p className="text-sm">Cordialmente,</p>
            <div className="space-y-1">
              <p className="text-sm">ANDRÉS VALBUENA C</p>
              <p className="text-xs text-muted-foreground">DIRECTOR DE COMPRAS</p>
              <p className="text-xs text-muted-foreground">Teléfono: 6012632892</p>
              <p className="text-xs text-muted-foreground">Celular: 3005272352</p>
              <p className="text-xs text-primary">compras@prosuministros.com</p>
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