import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInvoices, CreateInvoiceData } from '@/hooks/useInvoices';
import { useCustomers } from '@/hooks/useCustomers';

const invoiceSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  invoice_number: z.string().min(1, 'Invoice number is required'),
  invoice_date: z.string().min(1, 'Invoice date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  notes: z.string().optional(),
  items: z.array(z.object({
    product_name: z.string().min(1, 'Product name is required'),
    description: z.string().optional(),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unit_price: z.number().min(0, 'Unit price must be positive'),
    line_total: z.number().min(0, 'Line total must be positive'),
  })).min(1, 'At least one item is required'),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface CreateInvoiceProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateInvoice = ({ isOpen, onClose }: CreateInvoiceProps) => {
  const { createInvoice, isCreating } = useInvoices();
  const { customers } = useCustomers();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      items: [{ product_name: '', description: '', quantity: 1, unit_price: 0, line_total: 0 }],
    },
  });

  const items = watch('items') || [];
  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
  const tax = subtotal * 0.075; // 7.5% VAT
  const total = subtotal + tax;

  const onSubmit = (data: InvoiceFormData) => {
    createInvoice(data as CreateInvoiceData);
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogDescription>
            Generate a new invoice for your customer.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_id">Customer</Label>
              <Select onValueChange={(value) => setValue('customer_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.company_name || customer.contact_person || 'Unnamed Customer'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customer_id && (
                <p className="text-destructive text-sm">{errors.customer_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_number">Invoice Number</Label>
              <Input
                id="invoice_number"
                {...register('invoice_number')}
                placeholder="INV-001"
              />
              {errors.invoice_number && (
                <p className="text-destructive text-sm">{errors.invoice_number.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_date">Invoice Date</Label>
              <Input
                id="invoice_date"
                type="date"
                {...register('invoice_date')}
              />
              {errors.invoice_date && (
                <p className="text-destructive text-sm">{errors.invoice_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                {...register('due_date')}
              />
              {errors.due_date && (
                <p className="text-destructive text-sm">{errors.due_date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Invoice Items</Label>
              <div className="border rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-4 gap-2 text-sm font-medium">
                  <span>Product</span>
                  <span>Quantity</span>
                  <span>Unit Price</span>
                  <span>Total</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    placeholder="Product name"
                    value={items[0]?.product_name || ''}
                    onChange={(e) => {
                      const newItems = [...(items || [])];
                      newItems[0] = { ...newItems[0], product_name: e.target.value };
                      setValue('items', newItems);
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="1"
                    value={items[0]?.quantity || 1}
                    onChange={(e) => {
                      const newItems = [...(items || [])];
                      const quantity = parseInt(e.target.value) || 1;
                      const unitPrice = newItems[0]?.unit_price || 0;
                      newItems[0] = { 
                        ...newItems[0], 
                        quantity,
                        line_total: quantity * unitPrice 
                      };
                      setValue('items', newItems);
                    }}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={items[0]?.unit_price || 0}
                    onChange={(e) => {
                      const newItems = [...(items || [])];
                      const unitPrice = parseFloat(e.target.value) || 0;
                      const quantity = newItems[0]?.quantity || 1;
                      newItems[0] = { 
                        ...newItems[0], 
                        unit_price: unitPrice,
                        line_total: quantity * unitPrice 
                      };
                      setValue('items', newItems);
                    }}
                  />
                  <Input
                    type="number"
                    disabled
                    value={items[0]?.line_total || 0}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (7.5%):</span>
                <span>₦{tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes for the invoice..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInvoice;