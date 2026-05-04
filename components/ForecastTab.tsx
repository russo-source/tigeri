"use client";

import type { Expense } from "@/lib/types";
import { RunwayForecast } from "./RunwayForecast";

interface Props {
  expenses: Expense[];
}

export function ForecastTab({ expenses }: Props) {
  return <RunwayForecast expenses={expenses} />;
}
