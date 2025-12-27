import React from 'react';

export enum ButtonType {
  Number = 'NUMBER',
  Operator = 'OPERATOR',
  Action = 'ACTION', // Clear, Delete, Equals
  Function = 'FUNCTION' // %, +/-, AI
}

export interface CalculatorButton {
  label: string;
  value: string;
  type: ButtonType;
  span?: number; // Grid column span
  icon?: React.ReactNode;
}

export interface HistoryItem {
  expression: string;
  result: string;
  timestamp: number;
}