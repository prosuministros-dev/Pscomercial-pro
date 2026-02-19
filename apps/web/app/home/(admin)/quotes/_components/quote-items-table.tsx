'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@kit/ui/popover';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import type { QuoteItem } from '../_lib/types';

interface ProductOption {
  id: string;
  sku: string;
  name: string;
  unit_cost_usd: number;
  unit_cost_cop: number;
  suggested_price_cop: number | null;
  currency: string;
  is_service: boolean;
  is_license: boolean;
}

interface QuoteItemsTableProps {
  quoteId: string;
  currency: 'COP' | 'USD';
  trm: number;
  items: QuoteItem[];
  onItemsChange: () => void;
  readOnly?: boolean;
}

export function QuoteItemsTable({
  quoteId,
  currency,
  trm,
  items,
  onItemsChange,
  readOnly = false,
}: QuoteItemsTableProps) {
  const [editingItems, setEditingItems] = useState<QuoteItem[]>(items);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Product search state
  const [productResults, setProductResults] = useState<Record<number, ProductOption[]>>({});
  const [openPopovers, setOpenPopovers] = useState<Record<number, boolean>>({});
  const searchTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // Load existing items from API when quoteId changes
  useEffect(() => {
    if (!quoteId) return;
    const loadItems = async () => {
      try {
        const response = await fetch(`/api/quotes/${quoteId}/items`);
        if (response.ok) {
          const data = await response.json();
          const itemsList = Array.isArray(data) ? data : (data.data || []);
          if (itemsList.length > 0) {
            setEditingItems(itemsList);
          }
        }
      } catch (error) {
        console.error('Error loading items:', error);
      }
    };
    loadItems();
  }, [quoteId]);

  useEffect(() => {
    if (items.length > 0) {
      setEditingItems(items);
    }
  }, [items]);

  const calculateItemTotals = (item: Partial<QuoteItem>) => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unit_price || 0;
    const discountPct = item.discount_pct || 0;
    const taxPct = item.tax_pct || 19;
    const costPrice = item.cost_price || 0;

    const discountAmount = (unitPrice * quantity * discountPct) / 100;
    const subtotal = unitPrice * quantity - discountAmount;
    const taxAmount = (subtotal * taxPct) / 100;
    const total = subtotal + taxAmount;
    const marginPct = unitPrice > 0 ? ((unitPrice - costPrice) / unitPrice) * 100 : 0;

    return {
      discountAmount,
      subtotal,
      taxAmount,
      total,
      marginPct,
    };
  };

  const handleAddItem = async () => {
    const newItem: Partial<QuoteItem> = {
      sku: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      discount_pct: 0,
      tax_pct: 19,
      cost_price: 0,
    };

    setEditingItems([...editingItems, newItem as QuoteItem]);
    setIsAddingNew(true);
  };

  const handleSaveItem = async (index: number, item: Partial<QuoteItem>) => {
    // Prevent concurrent saves for the same item
    if (isSaving) return;
    setIsSaving(true);

    try {
      const calculated = calculateItemTotals(item);
      const itemData = {
        ...item,
        ...calculated,
      };

      if (item.id) {
        // Update existing item
        const response = await fetch(`/api/quotes/${quoteId}/items`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...itemData, item_id: item.id }),
        });

        if (!response.ok) {
          throw new Error('Error al actualizar el item');
        }

        const savedItem = await response.json();
        if (savedItem && savedItem.id) {
          const newItems = [...editingItems];
          newItems[index] = { ...newItems[index]!, ...savedItem };
          setEditingItems(newItems);
        }
      } else {
        // Create new item
        const response = await fetch(`/api/quotes/${quoteId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData),
        });

        if (!response.ok) {
          throw new Error('Error al crear el item');
        }

        // Store returned id to prevent duplicate POSTs on subsequent blurs
        const savedItem = await response.json();
        if (savedItem && savedItem.id) {
          const newItems = [...editingItems];
          newItems[index] = { ...newItems[index]!, ...savedItem };
          setEditingItems(newItems);
        }
      }

      toast.success('Item guardado correctamente');
      setIsAddingNew(false);
      onItemsChange();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Error al guardar el item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(
        `/api/quotes/${quoteId}/items?item_id=${itemId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Error al eliminar el item');
      }

      toast.success('Item eliminado correctamente');
      onItemsChange();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Error al eliminar el item');
    }
  };

  const handleFieldChange = (
    index: number,
    field: keyof QuoteItem,
    value: unknown
  ) => {
    const newItems = [...editingItems];
    newItems[index] = { ...newItems[index]!, [field]: value } as QuoteItem;
    setEditingItems(newItems);
  };

  const searchProducts = useCallback(async (index: number, query: string) => {
    if (query.length < 2) {
      setProductResults((prev) => ({ ...prev, [index]: [] }));
      setOpenPopovers((prev) => ({ ...prev, [index]: false }));
      return;
    }
    try {
      const res = await fetch(
        `/api/products?search=${encodeURIComponent(query)}&minimal=true&limit=10`
      );
      if (res.ok) {
        const data = await res.json();
        const results: ProductOption[] = data.data || [];
        setProductResults((prev) => ({ ...prev, [index]: results }));
        setOpenPopovers((prev) => ({ ...prev, [index]: results.length > 0 }));
      }
    } catch {
      // Silencioso – no interrumpir el flujo de edición
    }
  }, []);

  const handleProductSelect = (index: number, product: ProductOption) => {
    const unitPrice = product.suggested_price_cop ?? product.unit_cost_cop ?? 0;
    const costPrice =
      currency === 'USD' ? product.unit_cost_usd ?? 0 : product.unit_cost_cop ?? 0;

    const newItems = [...editingItems];
    newItems[index] = {
      ...newItems[index]!,
      product_id: product.id,
      sku: product.sku,
      description: product.name,
      unit_price: unitPrice,
      cost_price: costPrice,
    } as QuoteItem;
    setEditingItems(newItems);
    setOpenPopovers((prev) => ({ ...prev, [index]: false }));
    setProductResults((prev) => ({ ...prev, [index]: [] }));
  };

  const debouncedSearch = useCallback(
    (index: number, value: string) => {
      if (searchTimers.current[index]) {
        clearTimeout(searchTimers.current[index]);
      }
      searchTimers.current[index] = setTimeout(() => {
        searchProducts(index, value);
      }, 300);
    },
    [searchProducts]
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getCostInCOP = (costUSD: number) => {
    return currency === 'USD' ? costUSD * trm : costUSD;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Items de la Cotización</h3>
        {!readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddItem}
            disabled={isAddingNew}
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Item
          </Button>
        )}
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {!readOnly && <TableHead className="w-10"></TableHead>}
              <TableHead>SKU</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Cant.</TableHead>
              <TableHead>Precio Unit.</TableHead>
              <TableHead>Desc. %</TableHead>
              <TableHead>IVA %</TableHead>
              <TableHead>Subtotal</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead>Margen %</TableHead>
              {!readOnly && <TableHead className="w-10"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {editingItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={readOnly ? 10 : 12}
                  className="text-center py-8 text-gray-500"
                >
                  No hay items en esta cotización. Haz clic en "Agregar Item"
                  para comenzar.
                </TableCell>
              </TableRow>
            ) : (
              editingItems.map((item, index) => {
                const calculated = calculateItemTotals(item);
                const isNew = !item.id;

                return (
                  <TableRow key={item.id || `new-${index}`}>
                    {!readOnly && (
                      <TableCell>
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                      </TableCell>
                    )}
                    <TableCell>
                      <Popover
                        open={!!openPopovers[index] && !readOnly}
                        onOpenChange={(open) =>
                          setOpenPopovers((prev) => ({ ...prev, [index]: open }))
                        }
                      >
                        <PopoverTrigger asChild>
                          <Input
                            value={item.sku || ''}
                            onChange={(e) => {
                              handleFieldChange(index, 'sku', e.target.value);
                              debouncedSearch(index, e.target.value);
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                setOpenPopovers((prev) => ({ ...prev, [index]: false }));
                                handleSaveItem(index, editingItems[index]!);
                              }, 200);
                            }}
                            disabled={readOnly}
                            className="w-24"
                            autoComplete="off"
                            placeholder="SKU..."
                          />
                        </PopoverTrigger>
                        {(productResults[index] || []).length > 0 && (
                          <PopoverContent
                            className="w-80 p-1"
                            align="start"
                            onOpenAutoFocus={(e) => e.preventDefault()}
                          >
                            <div className="max-h-48 overflow-y-auto">
                              {(productResults[index] || []).map((product) => (
                                <button
                                  key={product.id}
                                  type="button"
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded cursor-pointer text-left"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleProductSelect(index, product);
                                  }}
                                >
                                  <span className="font-mono text-xs text-muted-foreground w-20 shrink-0 truncate">
                                    {product.sku}
                                  </span>
                                  <span className="truncate">{product.name}</span>
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        )}
                      </Popover>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.description || ''}
                        onChange={(e) =>
                          handleFieldChange(index, 'description', e.target.value)
                        }
                        onBlur={() => handleSaveItem(index, item)}
                        disabled={readOnly}
                        className="min-w-[200px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.quantity || 1}
                        onChange={(e) =>
                          handleFieldChange(
                            index,
                            'quantity',
                            parseFloat(e.target.value)
                          )
                        }
                        onBlur={() => handleSaveItem(index, item)}
                        disabled={readOnly}
                        className="w-20"
                        min="0.01"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.unit_price || 0}
                        onChange={(e) =>
                          handleFieldChange(
                            index,
                            'unit_price',
                            parseFloat(e.target.value)
                          )
                        }
                        onBlur={() => handleSaveItem(index, item)}
                        disabled={readOnly}
                        className="w-28"
                        min="0"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.discount_pct || 0}
                        onChange={(e) =>
                          handleFieldChange(
                            index,
                            'discount_pct',
                            parseFloat(e.target.value)
                          )
                        }
                        onBlur={() => handleSaveItem(index, item)}
                        disabled={readOnly}
                        className="w-16"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={String(item.tax_pct || 19)}
                        onValueChange={(value) =>
                          handleFieldChange(index, 'tax_pct', parseFloat(value))
                        }
                        disabled={readOnly}
                      >
                        <SelectTrigger className="w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="5">5%</SelectItem>
                          <SelectItem value="19">19%</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatCurrency(calculated.subtotal)}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-semibold">
                      {formatCurrency(calculated.total)}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.cost_price || 0}
                        onChange={(e) =>
                          handleFieldChange(
                            index,
                            'cost_price',
                            parseFloat(e.target.value)
                          )
                        }
                        onBlur={() => handleSaveItem(index, item)}
                        disabled={readOnly}
                        className="w-28"
                        min="0"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-mono text-sm font-semibold ${
                          calculated.marginPct < 7
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {calculated.marginPct.toFixed(2)}%
                      </span>
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        {item.id && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {currency === 'USD' && (
        <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
          💱 TRM aplicada: ${trm.toFixed(2)} COP/USD
        </div>
      )}
    </div>
  );
}
