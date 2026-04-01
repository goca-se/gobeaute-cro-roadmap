export const STATUS_CONFIG = {
  pending: {
    label: 'Pendente',
    labelFull: 'Pendente',
    color: '#9CA3AF',
    bg: '#F9FAFB',
    border: '#E5E7EB',
  },
  in_progress: {
    label: 'Em progresso',
    labelFull: 'Em progresso',
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
  },
  waiting_client: {
    label: 'Esp. cliente',
    labelFull: 'Esperando cliente',
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
  },
  validating: {
    label: 'Em validação',
    labelFull: 'Em validação',
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: '#DDD6FE',
  },
  done: {
    label: 'Finalizado',
    labelFull: 'Finalizado',
    color: '#16A34A',
    bg: '#F0FDF4',
    border: '#BBF7D0',
  },
}

export const STATUS_ORDER = ['pending', 'in_progress', 'waiting_client', 'validating', 'done']

export const RESPONSIBLE_CONFIG = {
  growth: { label: 'Growth', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  marketing: { label: 'Marketing', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  tech: { label: 'Tech', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
}

export const PRIORITY_CONFIG = {
  high: { label: 'Alta', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  medium: { label: 'Média', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  low: { label: 'Baixa', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
}
