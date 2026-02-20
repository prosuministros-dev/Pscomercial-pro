import { useState, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Download, Plus, Trash2, Eye, Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { toast } from 'sonner';
import html2pdf from 'html2pdf.js';
import logo from 'figma:asset/4bdd7f343c57ce38c8e0eb144768f690c100f5d8.png';

interface ItemCotizacion {
  id: string;
  noParte: string;
  descripcion: string;
  marca: string;
  valorUnitario: number;
  cantidad: number;
  entrega: string;
  garantia: string;
  iva: number;
  subtotal: number;
}

export function CotizacionFormato() {
  const [noCotizacion, setNoCotizacion] = useState('0025192');
  const [version, setVersion] = useState('V 1');
  const [fecha, setFecha] = useState('diciembre 30 de 2025');
  
  // Cliente
  const [cliente, setCliente] = useState('ALLIANZ TECHNOLOGY S.E, SUCURSAL COLOMBIANA');
  const [nit, setNit] = useState('901595160');
  const [contacto, setContacto] = useState('LORENA RIVAS');
  const [cargo, setCargo] = useState('COMPRAS');
  const [celular, setCelular] = useState('+573160242459');
  const [correo, setCorreo] = useState('lorena.rivas@allianz.co');
  const [ciudad, setCiudad] = useState('BOGOTA');
  
  // Condiciones
  const [entrega, setEntrega] = useState('5 DIAS CALENDARIO');
  const [formaPago, setFormaPago] = useState('Crédito 30 días');
  const [moneda, setMoneda] = useState('PESOS');
  
  // Items
  const [items, setItems] = useState<ItemCotizacion[]>([
    {
      id: '1',
      noParte: '4X20M2626',
      descripcion: 'CARGADOR NOTEBOOK 65W TIPO C/ADAPTADOR DE CORRIENTE DE 65 W DE LENOVO (USB TIPO C)1036872',
      marca: 'LENOVO',
      valorUnitario: 80335,
      cantidad: 1,
      entrega: '2 DIAS HABILES',
      garantia: '12 MESES',
      iva: 15263.65,
      subtotal: 80335
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
    const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
    const totalIva = items.reduce((acc, item) => acc + item.iva, 0);
    const total = subtotal + totalIva;
    return { subtotal, totalIva, total };
  };

  const { subtotal: totalSubtotal, totalIva, total: totalFinal } = calcularTotales();

  const agregarItem = () => {
    const nuevoItem: ItemCotizacion = {
      id: Date.now().toString(),
      noParte: '',
      descripcion: '',
      marca: '',
      valorUnitario: 0,
      cantidad: 1,
      entrega: '',
      garantia: '',
      iva: 0,
      subtotal: 0
    };
    setItems([...items, nuevoItem]);
  };

  const eliminarItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const actualizarItem = (id: string, campo: keyof ItemCotizacion, valor: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const itemActualizado = { ...item, [campo]: valor };
        // Recalcular subtotal e IVA
        if (campo === 'valorUnitario' || campo === 'cantidad') {
          itemActualizado.subtotal = itemActualizado.valorUnitario * itemActualizado.cantidad;
          itemActualizado.iva = itemActualizado.subtotal * 0.19;
        }
        return itemActualizado;
      }
      return item;
    }));
  };

  const pdfRef = useRef<HTMLDivElement>(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const generarPDF = async () => {
    const element = pdfRef.current;
    if (!element) return;
    
    setGenerandoPDF(true);
    toast.info('Generando PDF...');
    
    try {
      const opt = {
        margin: [15, 15, 15, 15],
        filename: `cotizacion_${noCotizacion}_${version}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 1200
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(element).save();
      toast.success('PDF generado exitosamente');
    } catch (error) {
      toast.error('Error al generar el PDF');
      console.error(error);
    } finally {
      setGenerandoPDF(false);
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
                <p style={{ margin: '2px 0' }}>Calle 25C Bis # 73B-63</p>
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
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#00C8CF', margin: '0 0 6px 0' }}>COTIZACIÓN No.</h2>
              <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '0' }}>{noCotizacion} {version}</p>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #d1d5db', margin: '12px 0' }} />

          {/* Cliente Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '12px' }}>
            <div>
              <div style={{ marginBottom: '10px' }}>
                <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>Señores (Cliente)</p>
                <p style={{ fontSize: '12px', fontWeight: '600', margin: '0' }}>{cliente}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>NIT</p>
                  <p style={{ fontSize: '12px', margin: '0' }}>{nit}</p>
                </div>
                <div>
                  <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>Ciudad</p>
                  <p style={{ fontSize: '12px', margin: '0' }}>{ciudad}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>Contacto</p>
                  <p style={{ fontSize: '12px', margin: '0' }}>{contacto}</p>
                </div>
                <div>
                  <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>Cargo</p>
                  <p style={{ fontSize: '12px', margin: '0' }}>{cargo}</p>
                </div>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>Celular</p>
                <p style={{ fontSize: '12px', margin: '0' }}>{celular}</p>
              </div>
              <div>
                <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>Correo</p>
                <p style={{ fontSize: '12px', color: '#00C8CF', margin: '0' }}>{correo}</p>
              </div>
            </div>

            <div>
              <div style={{ marginBottom: '10px' }}>
                <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>Fecha</p>
                <p style={{ fontSize: '12px', margin: '0' }}>{fecha}</p>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>Entrega</p>
                <p style={{ fontSize: '12px', margin: '0' }}>{entrega}</p>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>Forma de Pago</p>
                <p style={{ fontSize: '12px', margin: '0' }}>{formaPago}</p>
              </div>
              <div>
                <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 3px 0' }}>Moneda</p>
                <p style={{ fontSize: '12px', margin: '0' }}>{moneda}</p>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #d1d5db', margin: '12px 0' }} />

          {/* Items */}
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Detalle de Productos</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #d1d5db' }}>
                  <th style={{ textAlign: 'left', padding: '6px 4px', backgroundColor: '#f9fafb' }}>No. PARTE</th>
                  <th style={{ textAlign: 'left', padding: '6px 4px', backgroundColor: '#f9fafb' }}>DESCRIPCIÓN</th>
                  <th style={{ textAlign: 'left', padding: '6px 4px', backgroundColor: '#f9fafb' }}>ENTREGA</th>
                  <th style={{ textAlign: 'left', padding: '6px 4px', backgroundColor: '#f9fafb' }}>GARANTÍA</th>
                  <th style={{ textAlign: 'right', padding: '6px 4px', backgroundColor: '#f9fafb' }}>VR/UNITARIO</th>
                  <th style={{ textAlign: 'right', padding: '6px 4px', backgroundColor: '#f9fafb' }}>CANT.</th>
                  <th style={{ textAlign: 'right', padding: '6px 4px', backgroundColor: '#f9fafb' }}>IVA</th>
                  <th style={{ textAlign: 'right', padding: '6px 4px', backgroundColor: '#f9fafb' }}>SUBTOTAL</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '6px 4px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: '600' }}>{item.noParte}</div>
                      <div style={{ color: '#6b7280', fontSize: '9px' }}>{item.marca}</div>
                    </td>
                    <td style={{ padding: '6px 4px', verticalAlign: 'top', maxWidth: '250px' }}>{item.descripcion}</td>
                    <td style={{ padding: '6px 4px', verticalAlign: 'top' }}>{item.entrega}</td>
                    <td style={{ padding: '6px 4px', verticalAlign: 'top' }}>{item.garantia}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', verticalAlign: 'top' }}>{formatCurrency(item.valorUnitario)}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', verticalAlign: 'top' }}>{item.cantidad}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', verticalAlign: 'top' }}>{formatCurrency(item.iva)}</td>
                    <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: '600', verticalAlign: 'top' }}>{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #d1d5db', margin: '12px 0' }} />

          {/* Totales */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <div style={{ width: '350px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>SUB.TOTAL</span>
                <span style={{ fontSize: '12px' }}>{formatCurrency(totalSubtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>IVA (19%)</span>
                <span style={{ fontSize: '12px' }}>{formatCurrency(totalIva)}</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #d1d5db', margin: '6px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ fontWeight: 'bold', fontSize: '13px' }}>TOTAL</span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#00C8CF' }}>{formatCurrency(totalFinal)}</span>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #d1d5db', margin: '12px 0' }} />

          {/* Firma */}
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '12px', marginBottom: '8px' }}>Cordialmente,</p>
            <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
              <p style={{ fontWeight: '600', margin: '3px 0' }}>DANIEL VALBUENA</p>
              <p style={{ color: '#6b7280', margin: '3px 0' }}>GERENTE GENERAL</p>
              <p style={{ color: '#6b7280', margin: '3px 0' }}>Celular: 3204170057</p>
              <p style={{ color: '#00C8CF', margin: '3px 0' }}>gerencia@prosuministros.com</p>
            </div>
          </div>

          {/* Notas */}
          <div style={{ 
            backgroundColor: '#f3f4f6', 
            borderRadius: '6px', 
            padding: '12px', 
            fontSize: '9px',
            lineHeight: '1.5'
          }}>
            <p style={{ margin: '0' }}>
              <span style={{ fontWeight: '600' }}>NOTAS:</span> Una vez aprobada la cotización en dólares, esta se liquidará con la trm del día de la emisión de la factura.
              Se verificará el estado de los productos enviados. Los productos devueltos deberán ser sometidos a las siguientes políticas de devolución:
              - Para envíos fuera de Bogotá y mercancía no verificada al momento de la entrega, se establece un plazo de devolución por daños o defectos de fábrica de 1 día hábil.
              - No se aceptan devoluciones por productos en las siguientes condiciones: Mercancía en mal uso o manipulación, es decir, productos destapados, empaques deteriorados, rayados, etiquetas, letreros, cintas, logotipos o en general cualquier modificación que a juicio de Prosuministros afecten su posterior comercialización en las condiciones idóneas que a usted le gustaría recibir.
            </p>
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
                <p className="text-xs text-muted-foreground">PROSUMINISTROS DE COLOMBIA SAS</p>
                <p className="text-xs text-muted-foreground">NIT: 900692169-9</p>
                <p className="text-xs text-muted-foreground">Calle 25C Bis # 73B-63</p>
                <p className="text-xs text-muted-foreground">TEL: 6012632892</p>
                <p className="text-xs text-muted-foreground">Bogotá</p>
              </div>
            </div>
            
            <div className="bg-primary/10 rounded-lg px-6 py-4 border border-primary/20">
              <div className="space-y-1">
                <h2 className="text-2xl tracking-tight text-primary">COTIZACIÓN No.</h2>
                <p className="text-3xl tracking-tight">{noCotizacion} {version}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Cliente Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Señores (Cliente)</Label>
                <p className="text-sm mt-1">{cliente}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">NIT</Label>
                  <p className="text-sm mt-1">{nit}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Ciudad</Label>
                  <p className="text-sm mt-1">{ciudad}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Contacto</Label>
                  <p className="text-sm mt-1">{contacto}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Cargo</Label>
                  <p className="text-sm mt-1">{cargo}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Celular</Label>
                <p className="text-sm mt-1">{celular}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Correo</Label>
                <p className="text-sm mt-1 text-primary">{correo}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Fecha</Label>
                <p className="text-sm mt-1">{fecha}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Entrega</Label>
                <p className="text-sm mt-1">{entrega}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Forma de Pago</Label>
                <p className="text-sm mt-1">{formaPago}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Moneda</Label>
                <p className="text-sm mt-1">{moneda}</p>
              </div>
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
                    <th className="text-left text-xs text-muted-foreground p-2 font-medium">No. PARTE</th>
                    <th className="text-left text-xs text-muted-foreground p-2 font-medium">DESCRIPCIÓN</th>
                    <th className="text-left text-xs text-muted-foreground p-2 font-medium">ENTREGA</th>
                    <th className="text-left text-xs text-muted-foreground p-2 font-medium">GARANTÍA</th>
                    <th className="text-right text-xs text-muted-foreground p-2 font-medium">VR/UNITARIO</th>
                    <th className="text-right text-xs text-muted-foreground p-2 font-medium">CANT.</th>
                    <th className="text-right text-xs text-muted-foreground p-2 font-medium">IVA</th>
                    <th className="text-right text-xs text-muted-foreground p-2 font-medium">SUBTOTAL</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className="border-b border-border/50">
                      <td className="p-2">
                        <Input 
                          value={item.noParte}
                          onChange={(e) => actualizarItem(item.id, 'noParte', e.target.value)}
                          className="h-8 text-xs"
                          placeholder="No. Parte"
                        />
                        <Input 
                          value={item.marca}
                          onChange={(e) => actualizarItem(item.id, 'marca', e.target.value)}
                          className="h-8 text-xs mt-1"
                          placeholder="Marca"
                        />
                      </td>
                      <td className="p-2">
                        <Textarea 
                          value={item.descripcion}
                          onChange={(e) => actualizarItem(item.id, 'descripcion', e.target.value)}
                          className="min-h-[60px] text-xs resize-none"
                          placeholder="Descripción del producto"
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          value={item.entrega}
                          onChange={(e) => actualizarItem(item.id, 'entrega', e.target.value)}
                          className="h-8 text-xs"
                          placeholder="Entrega"
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
                          value={item.valorUnitario}
                          onChange={(e) => actualizarItem(item.id, 'valorUnitario', parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs text-right"
                          placeholder="0"
                        />
                      </td>
                      <td className="p-2">
                        <Input 
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => actualizarItem(item.id, 'cantidad', parseInt(e.target.value) || 0)}
                          className="h-8 text-xs text-right w-20"
                          min="1"
                        />
                      </td>
                      <td className="p-2 text-right text-xs">
                        {formatCurrency(item.iva)}
                      </td>
                      <td className="p-2 text-right text-xs">
                        {formatCurrency(item.subtotal)}
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
                <span className="text-sm text-muted-foreground">SUB.TOTAL</span>
                <span className="text-sm">{formatCurrency(totalSubtotal)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">IVA (19%)</span>
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
              <p className="text-sm">DANIEL VALBUENA</p>
              <p className="text-xs text-muted-foreground">GERENTE GENERAL</p>
              <p className="text-xs text-muted-foreground">Celular: 3204170057</p>
              <p className="text-xs text-primary">gerencia@prosuministros.com</p>
            </div>
          </div>

          {/* Notas */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-xs">
              <span className="font-medium">NOTAS:</span> Una vez aprobada la cotización en dólares, esta se liquidará con la trm del día de la emisión de la factura.
              Se verificará el estado de los productos enviados. Los productos devueltos deberán ser sometidos a las siguientes políticas de devolución:
              - Para envíos fuera de Bogotá y mercancía no verificada al momento de la entrega, se establece un plazo de devolución por daños o defectos de fábrica de 1 día hábil.
              - No se aceptan devoluciones por productos en las siguientes condiciones: Mercancía en mal uso o manipulación, es decir, productos destapados, empaques deteriorados, rayados, etiquetas, letreros, cintas, logotipos o en general cualquier modificación que a juicio de Prosuministros afecten su posterior comercialización en las condiciones idóneas que a usted le gustaría recibir.
            </p>
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