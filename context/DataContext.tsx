import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { Payment, NewPayment, Group, Expense, NewExpense } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../services/supabase';

interface DataContextProps {
  payments: Payment[];
  addPayment: (payment: NewPayment) => Promise<void>;
  updatePayment: (payment: Payment) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  expenses: Expense[];
  addExpense: (expense: NewExpense) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  groups: Group[];
  addGroup: (groupName: string) => Promise<boolean>;
  deleteGroup: (groupId: string) => Promise<void>;
  reminderPeriod: number;
  setReminderPeriod: (days: number) => void;
  isLoading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [reminderPeriod, setReminderPeriod] = useState<number>(7); // This can remain a local setting for now
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);


  const fetchData = useCallback(async () => {
    if (!currentUser) {
        setIsLoading(false);
        setPayments([]);
        setExpenses([]);
        setGroups([]);
        return;
    };
    setIsLoading(true);
    setError(null);
    try {
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('date', { ascending: false });
      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);
      
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('date', { ascending: false });
      if (expensesError) throw expensesError;
      setExpenses(expensesData || []);

      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('id, name')
        .eq('user_id', currentUser.id)
        .order('name', { ascending: true });
        
      if (groupsError) throw groupsError;
      setGroups(groupsData || []);

    } catch (err: any) {
        const errorMessage = `فشل في جلب البيانات: ${err.message}`;
        console.error("Error fetching data:", errorMessage);
        setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const addPayment = async (payment: NewPayment) => {
    if (!currentUser) return;
    const { data, error } = await supabase
        .from('payments')
        .insert({ ...payment, user_id: currentUser.id })
        .select()
        .single();
    if (error) {
        console.error("Error adding payment:", error);
    } else if (data) {
        setPayments(prev => [data, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  };

  const updatePayment = async (updatedPayment: Payment) => {
    const { data, error } = await supabase
        .from('payments')
        .update({ 
            studentName: updatedPayment.studentName,
            groupName: updatedPayment.groupName,
            amount: updatedPayment.amount,
            date: updatedPayment.date
        })
        .eq('id', updatedPayment.id)
        .select()
        .single();
    
    if (error) {
        console.error("Error updating payment:", error);
    } else if (data) {
        setPayments(prev => prev.map(p => p.id === data.id ? data : p)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  };

  const deletePayment = async (id: string) => {
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) {
        console.error("Error deleting payment:", error);
    } else {
        setPayments(prev => prev.filter(p => p.id !== id));
    }
  };

  const addExpense = async (expense: NewExpense) => {
    if (!currentUser) return;
    const { data, error } = await supabase
        .from('expenses')
        .insert({ ...expense, user_id: currentUser.id })
        .select()
        .single();
    if (error) {
        console.error("Error adding expense:", error);
    } else if (data) {
        setExpenses(prev => [data, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  };
  
  const updateExpense = async (updatedExpense: Expense) => {
    const { data, error } = await supabase
        .from('expenses')
        .update({ 
            description: updatedExpense.description,
            amount: updatedExpense.amount,
            date: updatedExpense.date
        })
        .eq('id', updatedExpense.id)
        .select()
        .single();
    
    if (error) {
        console.error("Error updating expense:", error);
    } else if (data) {
        setExpenses(prev => prev.map(e => e.id === data.id ? data : e)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
        console.error("Error deleting expense:", error);
    } else {
        setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };


  const addGroup = async (groupName: string): Promise<boolean> => {
    const trimmedGroupName = groupName.trim();
    if (!trimmedGroupName || !currentUser) return false;

    const { data, error } = await supabase
      .from('groups')
      .insert({ name: trimmedGroupName, user_id: currentUser.id })
      .select('id, name')
      .single();

    if (error) {
      console.error('Error adding group:', error.message);
      if (error.code === '23505') { // unique_violation
          alert('اسم المجموعة ده موجود قبل كده.');
      }
      return false;
    }
    
    if (data) {
        setGroups(prev => [...prev, data]);
        return true;
    }
    return false;
  };

  const deleteGroup = async (groupId: string) => {
    const { error } = await supabase.from('groups').delete().eq('id', groupId);
    if (error) {
        console.error("Error deleting group:", error);
    } else {
        setGroups(prev => prev.filter(g => g.id !== groupId));
    }
  };
  
  const handleSetReminderPeriod = (days: number) => {
    if (!isNaN(days) && days >= 0) {
      setReminderPeriod(days);
    }
  };

  const value = { 
    payments, 
    addPayment, 
    updatePayment, 
    deletePayment, 
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    groups, 
    addGroup, 
    deleteGroup, 
    reminderPeriod, 
    setReminderPeriod: handleSetReminderPeriod,
    isLoading,
    error,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};