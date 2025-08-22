import { Progress } from "@/components/ui/progress";
import { useProgress } from "@/hooks/useProgress";

interface ProgressBarProps {
  className?: string;
}

export const ProgressBar = ({ className = "" }: ProgressBarProps) => {
  const { progress, loading, error } = useProgress();
  
  if (loading) {
    return (
      <div className={`space-y-3 animate-pulse ${className}`}>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-baby-blue/20 rounded w-1/3"></div>
          <div className="h-4 bg-baby-blue/20 rounded w-12"></div>
        </div>
        <div className="h-3 bg-baby-blue/20 rounded"></div>
        <div className="flex justify-between">
          <div className="h-3 bg-baby-blue/20 rounded w-1/4"></div>
          <div className="h-3 bg-baby-blue/20 rounded w-1/4"></div>
        </div>
      </div>
    );
  }
  
  if (error || !progress) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <p className="text-sm text-muted-foreground">Erro ao carregar progresso</p>
      </div>
    );
  }
  
  const current = progress.raised_cents;
  const goal = progress.goal_cents;
  const percentage = Math.min((current / goal) * 100, 100);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  return (
    <div className={`space-y-3 ${className}`} role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-foreground">Progresso do Enxoval</span>
        <span className="text-muted-foreground">{Math.round(percentage)}%</span>
      </div>
      
      <Progress 
        value={percentage} 
        className="h-3 bg-baby-blue/30"
        aria-label={`${Math.round(percentage)}% do enxoval completo`}
      />
      
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>Arrecadado: <span className="font-semibold text-primary">{formatCurrency(current)}</span></span>
        <span>Meta: <span className="font-semibold">{formatCurrency(goal)}</span></span>
      </div>
    </div>
  );
};