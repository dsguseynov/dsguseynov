export type TransactionType = "expense" | "income" | "transfer";

export type Wallet = {
  id: string;
  name: string;
  currency: string;
  icon: string;
  color: string;
  startBalance: number;
  archived: boolean;
  balance: number;
};

export type Category = {
  id: string;
  name: string;
  type: "expense" | "income";
  icon: string;
  color: string;
  archived: boolean;
};

export type WalletRef = { id: string; name: string; icon: string; currency: string };

export type Transaction = {
  id: string;
  walletId: string;
  categoryId: string | null;
  type: TransactionType;
  amount: number;
  note: string | null;
  date: string;
  transferToWalletId: string | null;
  category: Category | null;
  wallet: WalletRef;
  transferToWallet: WalletRef | null;
};

export type Budget = {
  id: string;
  categoryId: string | null;
  name: string;
  amount: number;
  month: number;
  year: number;
  category: Category | null;
  spent: number;
};

export type Summary = {
  totalBalance: number;
  wallets: Wallet[];
  month: number;
  year: number;
  income: number;
  expense: number;
  categoryBreakdown: {
    categoryId: string | null;
    name: string;
    icon: string;
    color: string;
    total: number;
  }[];
  recentTransactions: Transaction[];
};

export type AuthUser = { id: string; name: string; email: string };
