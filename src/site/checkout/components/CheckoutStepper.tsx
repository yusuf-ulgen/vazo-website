import { Check } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface StepItem {
  id: number;
  label: string;
}

interface CheckoutStepperProps {
  currentStep: number;
  steps: StepItem[];
  onStepClick?: (stepId: number) => void;
}

export function CheckoutStepper({ currentStep, steps, onStepClick }: CheckoutStepperProps) {
  return (
    <nav aria-label="Sipariş Aşamaları" className="w-full py-4 mb-8">
      <ol className="flex items-center justify-between max-w-2xl mx-auto relative">
        {/* Background Connecting Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-border-subtle z-0" />

        {steps.map((step) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <li key={step.id} className="relative z-10 flex flex-col items-center">
              <button
                type="button"
                disabled={!isCompleted && !isCurrent}
                onClick={() => isCompleted && onStepClick?.(step.id)}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold font-mono transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2',
                  isCompleted &&
                    'bg-feedback-success text-surface-primary cursor-pointer hover:opacity-90',
                  isCurrent &&
                    'bg-text-primary text-canvas-default ring-4 ring-surface-muted',
                  !isCompleted &&
                    !isCurrent &&
                    'bg-surface-secondary text-text-muted border border-border-default cursor-not-allowed'
                )}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`${step.label} (${isCompleted ? 'Tamamlandı' : isCurrent ? 'Mevcut Aşama' : 'Bekliyor'})`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.id}
              </button>
              <span
                className={cn(
                  'text-[11px] mt-2 font-medium tracking-tight whitespace-nowrap transition-colors hidden sm:block',
                  isCurrent ? 'text-text-primary font-semibold' : 'text-text-secondary'
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
