import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface Progress {
  raised_cents: number;
  goal_cents: number;
}

export const useProgress = () => {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const { data, error } = await supabase
          .from('v_progress')
          .select('*')
          .single();

        if (error) throw error;
        setProgress(data);
      } catch (err) {
        console.error('Error fetching progress:', err);
        setError('Erro ao carregar progresso');
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('progress-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: 'status=eq.paid'
        },
        () => {
          fetchProgress();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { progress, loading, error };
};