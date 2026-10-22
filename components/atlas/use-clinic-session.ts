"use client";
import { useReducer } from "react";
import { clinicAttempt, clinicTransition } from "@/lib/clinic/session";

export function useClinicSession() {
  const [attempts, dispatch] = useReducer(clinicTransition, {});
  return {
    attempts,
    dispatch,
    attempt: (id: Parameters<typeof clinicAttempt>[1]) =>
      clinicAttempt(attempts, id),
  };
}
export type ClinicController = ReturnType<typeof useClinicSession>;
