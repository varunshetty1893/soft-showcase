// components/ui/toast/useToast.ts
"use client";

import * as React from "react";
import { ToastContext, type ToastContextValue } from "./ToastProvider";

const noopToast: ToastContextValue = {
  toasts: [],
  toast: () => "",
  success: () => "",
  error: () => "",
  warning: () => "",
  info: () => "",
  dismiss: () => {},
  clearAll: () => {},
};

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  return ctx ?? noopToast;
}
