import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface InvoiceItem {
  id?: string;
  product_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  customer_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  discount_amount?: number;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  terms?: string;
  created_at: string;
  updated_at: string;
  customer?: {
    company_name?: string;
    contact_person?: string;
    email?: string;
  };
  invoice_items: InvoiceItem[];
}

export interface CreateInvoiceData {
  customer_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  notes?: string;
  terms?: string;
  items: Omit<InvoiceItem, 'id'>[];
}

export const useInvoices = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch invoices
  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ['invoices'],
    queryFn: async (): Promise<Invoice[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(company_name, contact_person, email),
          invoice_items(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: CreateInvoiceData) => {
      if (!user) throw new Error('User not authenticated');

      // Calculate totals
      const subtotal = invoiceData.items.reduce((sum, item) => sum + item.line_total, 0);
      const tax_amount = subtotal * 0.075; // 7.5% VAT for Nigeria
      const total_amount = subtotal + tax_amount;

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          ...invoiceData,
          user_id: user.id,
          subtotal,
          tax_amount,
          total_amount,
          amount_due: total_amount,
          items: undefined, // Remove items from invoice data
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const itemsWithInvoiceId = invoiceData.items.map(item => ({
        ...item,
        invoice_id: invoice.id,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsWithInvoiceId);

      if (itemsError) throw itemsError;

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  // Update invoice status mutation
  const updateInvoiceStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Invoice['status'] }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: "Success",
        description: "Invoice status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice status",
        variant: "destructive",
      });
    },
  });

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async ({ invoiceId, amount, paymentMethod, referenceNumber }: {
      invoiceId: string;
      amount: number;
      paymentMethod: string;
      referenceNumber?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Get current invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('amount_paid, total_amount')
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      const newAmountPaid = invoice.amount_paid + amount;
      const newAmountDue = invoice.total_amount - newAmountPaid;
      const newStatus = newAmountDue <= 0 ? 'paid' : 'sent';

      // Update invoice
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          amount_paid: newAmountPaid,
          amount_due: newAmountDue,
          status: newStatus,
        })
        .eq('id', invoiceId);

      if (updateError) throw updateError;

      // Record payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          payment_type: 'invoice_payment',
          reference_id: invoiceId,
          payment_method: paymentMethod,
          amount,
          reference_number: referenceNumber,
        });

      if (paymentError) throw paymentError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete invoice",
        variant: "destructive",
      });
    },
  });

  return {
    invoices: invoices || [],
    isLoading,
    error,
    createInvoice: createInvoiceMutation.mutate,
    updateInvoiceStatus: updateInvoiceStatusMutation.mutate,
    recordPayment: recordPaymentMutation.mutate,
    deleteInvoice: deleteInvoiceMutation.mutate,
    isCreating: createInvoiceMutation.isPending,
    isUpdatingStatus: updateInvoiceStatusMutation.isPending,
    isRecordingPayment: recordPaymentMutation.isPending,
    isDeleting: deleteInvoiceMutation.isPending,
  };
};