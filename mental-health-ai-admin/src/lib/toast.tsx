'use client';

import { toast } from 'sonner';

interface ConfirmToastOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function confirmToast({
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
}: ConfirmToastOptions): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (value: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(value);
    };

    const toastId = toast(title, {
      description,
      duration: Infinity,
      action: {
        label: confirmLabel,
        onClick: () => {
          finish(true);
          toast.dismiss(toastId);
        },
      },
      cancel: {
        label: cancelLabel,
        onClick: () => {
          finish(false);
          toast.dismiss(toastId);
        },
      },
      onDismiss: () => finish(false),
    });
  });
}