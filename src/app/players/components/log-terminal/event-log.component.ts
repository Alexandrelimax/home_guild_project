import { Component, input, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { GameLog } from '../../../interfaces/interface';

@Component({
  selector: 'app-log-terminal',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './event-log.html',
  styleUrls: ['./event-log.css']
})
export class EventLogComponent {
  logs = input.required<GameLog[]>();
  title = input<string>('Terminal_Output');
  variant = input<'compact' | 'full'>('compact');
  maxHeight = input<string>('calc(100vh - 160px)');

  // Tradução simplificada para os badges
  private readonly LABELS: Record<string, string> = {
    'approved': 'APROVADO',
    'rejected': 'REJEITADO',
    'analyzing': 'ANALISANDO',
    'levelup': 'LEVEL UP',
    'downgrade': 'DOWNGRADE',
    'info': 'SISTEMA',
    'error': 'FALHA'
  };

  // Retorna a classe base do tema (ex: log-theme-downgrade)
  // Se o tipo não existir, cai no 'info' (Ciano)
  getThemeClass(type: string): string {
    const validTypes = ['approved', 'rejected', 'analyzing', 'levelup', 'downgrade', 'error'];
    const theme = validTypes.includes(type) ? type : 'info';
    return `log-theme-${theme}`;
  }

  getLabel(type: string): string {
    return this.LABELS[type] || type.toUpperCase();
  }

  // Layout reativo
  terminalClass = computed(() => this.variant() === 'compact' ? 'w-full lg:w-80' : 'w-full');
  statusColorClass = computed(() => this.variant() === 'compact' ? 'bg-rose-500' : 'bg-emerald-500');
}