import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExportFiltersProps {
  onExport: (filters: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    paymentMethod?: string;
  }) => void;
  includePending?: boolean;
}

export const ExportFilters = ({ onExport, includePending = false }: ExportFiltersProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<string>('all');
  const [paymentMethod, setPaymentMethod] = useState<string>('all');

  const handleExport = () => {
    onExport({
      startDate,
      endDate,
      status,
      paymentMethod
    });
    setDialogOpen(false);
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setStatus('all');
    setPaymentMethod('all');
  };

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>
        <Download className="w-4 h-4 mr-2" />
        Exportar CSV
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Exportar para CSV</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Date Range */}
            <div className="space-y-4">
              <Label>Período</Label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label className="text-sm text-muted-foreground">Data Inicial</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex-1">
                  <Label className="text-sm text-muted-foreground">Data Final</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        locale={ptBR}
                        disabled={(date) => startDate ? date < startDate : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {includePending && <SelectItem value="pending">Pendente</SelectItem>}
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method Filter */}
            <div className="space-y-2">
              <Label>Método de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleExport}>
                  Exportar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};