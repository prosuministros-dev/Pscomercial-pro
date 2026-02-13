'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, DollarSign, Package } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Textarea } from '@kit/ui/textarea';
import { Switch } from '@kit/ui/switch';
import { RadioGroup, RadioGroupItem } from '@kit/ui/radio-group';
import { productFormSchema, type ProductFormData } from '../_lib/schemas';
import { useCreateProduct, useUpdateProduct, useTRM } from '../_lib/product-queries';
import type { Product, UserRole } from '../_lib/types';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@kit/ui/badge';

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  mode: 'create' | 'edit';
  categories?: Array<{ id: string; name: string }>;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  mode,
  categories = [],
}: ProductFormDialogProps) {
  const supabase = useSupabase();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const { data: trmData } = useTRM();

  // Fetch current user role
  const { data: userRole } = useQuery<UserRole>({
    queryKey: ['user-role'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          user_roles (
            role:roles (
              slug
            )
          )
        `)
        .eq('id', user.id)
        .single();

      if (!profile?.user_roles || profile.user_roles.length === 0) {
        return null;
      }

      const roleSlug = (profile.user_roles as any)[0]?.role?.slug;
      return roleSlug as UserRole;
    },
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    control,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      category_id: '',
      brand: '',
      tax: null,
      unit_cost_usd: 0,
      unit_cost_cop: 0,
      suggested_price_cop: null,
      currency: 'COP',
      is_service: false,
      is_license: false,
      is_active: true,
    },
  });

  const selectedCategoryId = watch('category_id');
  const selectedCurrency = watch('currency');
  const isService = watch('is_service');
  const isLicense = watch('is_license');
  const isActive = watch('is_active');
  const unitCostUsd = watch('unit_cost_usd');
  const unitCostCop = watch('unit_cost_cop');

  // Determine field permissions based on user role
  const canEditCategory = userRole === 'gerente_general';
  const canEditBrand = userRole === 'gerente_general';
  const canEditTax = userRole === 'gerente_general';

  // Reset form when dialog opens/closes or product changes
  useEffect(() => {
    if (open && product && mode === 'edit') {
      reset({
        sku: product.sku,
        name: product.name,
        description: product.description || '',
        category_id: product.category_id,
        brand: product.brand || '',
        tax: product.tax || null,
        unit_cost_usd: product.unit_cost_usd,
        unit_cost_cop: product.unit_cost_cop,
        suggested_price_cop: product.suggested_price_cop || null,
        currency: product.currency,
        is_service: product.is_service,
        is_license: product.is_license,
        is_active: product.is_active,
      });
    } else if (open && mode === 'create') {
      reset({
        sku: '',
        name: '',
        description: '',
        category_id: '',
        brand: '',
        tax: null,
        unit_cost_usd: 0,
        unit_cost_cop: 0,
        suggested_price_cop: null,
        currency: 'COP',
        is_service: false,
        is_license: false,
        is_active: true,
      });
    }
  }, [open, product, mode, reset]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(data);
      } else if (product) {
        await updateMutation.mutateAsync({ id: product.id, data });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Crear nuevo producto' : 'Editar producto'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Complete la información del nuevo producto. Los campos marcados con * son obligatorios.'
              : 'Modifique la información del producto. Los campos marcados con * son obligatorios.'}
          </DialogDescription>
          {trmData && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>TRM actual: {new Intl.NumberFormat('es-CO').format(trmData.value)} COP/USD</span>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Información Básica
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SKU */}
              <div className="space-y-2">
                <Label htmlFor="sku">
                  SKU (Número de parte) *
                </Label>
                <Input
                  id="sku"
                  {...register('sku')}
                  placeholder="Ej: HW-001"
                  aria-invalid={errors.sku ? 'true' : 'false'}
                  className="font-mono"
                />
                {errors.sku && (
                  <p className="text-sm text-destructive">
                    {errors.sku.message}
                  </p>
                )}
              </div>

              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Producto *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Ej: Laptop Dell Latitude 5520"
                  aria-invalid={errors.name ? 'true' : 'false'}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Descripción detallada del producto..."
                rows={3}
                aria-invalid={errors.description ? 'true' : 'false'}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category_id">
                  Categoría (Vertical) *
                  {!canEditCategory && mode === 'edit' && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Solo lectura
                    </Badge>
                  )}
                </Label>
                <Select
                  value={selectedCategoryId}
                  onValueChange={(value) => setValue('category_id', value)}
                  disabled={!canEditCategory && mode === 'edit'}
                >
                  <SelectTrigger id="category_id">
                    <SelectValue placeholder="Seleccione categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category_id && (
                  <p className="text-sm text-destructive">
                    {errors.category_id.message}
                  </p>
                )}
              </div>

              {/* Brand */}
              <div className="space-y-2">
                <Label htmlFor="brand">
                  Marca *
                  {!canEditBrand && mode === 'edit' && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Solo lectura
                    </Badge>
                  )}
                </Label>
                <Input
                  id="brand"
                  {...register('brand')}
                  placeholder="Ej: Dell, HP, Microsoft"
                  disabled={!canEditBrand && mode === 'edit'}
                  aria-invalid={errors.brand ? 'true' : 'false'}
                />
                {errors.brand && (
                  <p className="text-sm text-destructive">
                    {errors.brand.message}
                  </p>
                )}
              </div>

              {/* Tax */}
              <div className="space-y-2">
                <Label htmlFor="tax">
                  Impuesto (%)
                  {!canEditTax && mode === 'edit' && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Solo lectura
                    </Badge>
                  )}
                </Label>
                <Controller
                  name="tax"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="tax"
                      type="number"
                      step="0.01"
                      placeholder="Ej: 19"
                      disabled={!canEditTax && mode === 'edit'}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === '' ? null : parseFloat(val));
                      }}
                    />
                  )}
                />
                {errors.tax && (
                  <p className="text-sm text-destructive">
                    {errors.tax.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Información de Costos
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Unit Cost USD */}
              <div className="space-y-2">
                <Label htmlFor="unit_cost_usd">Costo Unitario USD</Label>
                <Controller
                  name="unit_cost_usd"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="unit_cost_usd"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
                {errors.unit_cost_usd && (
                  <p className="text-sm text-destructive">
                    {errors.unit_cost_usd.message}
                  </p>
                )}
              </div>

              {/* Unit Cost COP */}
              <div className="space-y-2">
                <Label htmlFor="unit_cost_cop">Costo Unitario COP</Label>
                <Controller
                  name="unit_cost_cop"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="unit_cost_cop"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
                {errors.unit_cost_cop && (
                  <p className="text-sm text-destructive">
                    {errors.unit_cost_cop.message}
                  </p>
                )}
              </div>

              {/* Suggested Price COP */}
              <div className="space-y-2">
                <Label htmlFor="suggested_price_cop">Precio Sugerido COP</Label>
                <Controller
                  name="suggested_price_cop"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="suggested_price_cop"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === '' ? null : parseFloat(val));
                      }}
                    />
                  )}
                />
                {errors.suggested_price_cop && (
                  <p className="text-sm text-destructive">
                    {errors.suggested_price_cop.message}
                  </p>
                )}
              </div>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label>Moneda Principal</Label>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex items-center gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="COP" id="currency-cop" />
                      <Label htmlFor="currency-cop" className="font-normal cursor-pointer">
                        COP (Pesos Colombianos)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="USD" id="currency-usd" />
                      <Label htmlFor="currency-usd" className="font-normal cursor-pointer">
                        USD (Dólares)
                      </Label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>
          </div>

          {/* Product Flags */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Opciones</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Is Service */}
              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="is_service" className="cursor-pointer">
                    Es Servicio
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Marcar si es un servicio
                  </p>
                </div>
                <Controller
                  name="is_service"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="is_service"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              {/* Is License */}
              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="is_license" className="cursor-pointer">
                    Es Licencia
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Marcar si es una licencia
                  </p>
                </div>
                <Controller
                  name="is_license"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="is_license"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              {/* Is Active */}
              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Activo
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Producto disponible
                  </p>
                </div>
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="is_active"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Crear producto' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
