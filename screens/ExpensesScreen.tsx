
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Expense } from '../types';
import Modal from '../components/Modal';
import ExpenseForm from '../components/ExpenseForm';
import { Edit, Trash2, PlusCircle, Search } from 'lucide-react';

const ExpensesScreen: React.FC = () => {
  const { expenses, deleteExpense } = useData();
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const availableMonths = useMemo(() => {
    const months = new Set(expenses.map(e => e.date.slice(0, 7)));
    const currentMonth = new Date().toISOString().slice(0, 7);
    months.add(currentMonth);
    return Array.from(months).sort().reverse();
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(e => e.date.startsWith(selectedMonth))
      .filter(e => 
        e.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [expenses, selectedMonth, searchTerm]);

  const monthlyTotal = useMemo(() => {
    return filteredExpenses.reduce((acc, p) => acc + p.amount, 0);
  }, [filteredExpenses]);

  const handleEdit = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsExpenseModalOpen(true);
  };

  const handleAddNew = () => {
    setExpenseToEdit(null);
    setIsExpenseModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('متأكد إنك عايز تمسح المصروف ده؟')) {
      deleteExpense(id);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl font-black text-white">كشف المصروفات</h1>
        <p className="text-brand-secondary mt-2">سجّل وعدّل كل المصروفات الشهرية بتاعتك.</p>
      </header>

      <div className="bg-brand-navy p-4 rounded-xl shadow-lg flex flex-col md:flex-row md:items-center gap-4 flex-wrap">
        <button
          onClick={handleAddNew}
          className="bg-brand-gold text-brand-blue font-bold py-3 px-5 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition shadow-md flex-shrink-0"
        >
          <PlusCircle size={20} />
          إضافة مصروف جديد
        </button>
        <div className="relative flex-grow min-w-[200px]">
          <input
            type="text"
            placeholder="دور على مصروف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-brand-blue border border-brand-secondary rounded-lg p-3 pr-10 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none transition text-white"
          />
          <Search size={20} className="absolute top-1/2 right-3 -translate-y-1/2 text-brand-secondary" />
        </div>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-brand-blue border border-brand-secondary rounded-lg p-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none transition flex-shrink-0 text-white"
        >
          {availableMonths.map(month => (
            <option key={month} value={month}>{new Date(month + '-02').toLocaleString('ar-EG', { month: 'long', year: 'numeric' })}</option>
          ))}
        </select>
      </div>
      
      <div className="bg-brand-navy p-2 md:p-4 rounded-xl shadow-lg overflow-x-auto">
        <table className="w-full min-w-[600px] text-right">
          <thead className="border-b-2 border-brand-gold/20">
            <tr>
              <th className="p-4 text-brand-gold font-bold">وصف المصروف</th>
              <th className="p-4 text-brand-gold font-bold">المبلغ</th>
              <th className="p-4 text-brand-gold font-bold">التاريخ</th>
              <th className="p-4 text-brand-gold font-bold text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length > 0 ? filteredExpenses.map(e => (
              <tr key={e.id} className="border-b border-white/10 hover:bg-white/5">
                <td className="p-4 text-white font-semibold">{e.description}</td>
                <td className="p-4 font-mono text-brand-light">ج.م {e.amount.toLocaleString('ar-EG')}</td>
                <td className="p-4 text-brand-secondary">{new Date(e.date).toLocaleDateString('ar-EG')}</td>
                <td className="p-4 flex justify-center items-center gap-2">
                  <button onClick={() => handleEdit(e)} className="p-2 text-blue-400 hover:text-blue-300 transition"><Edit size={20} /></button>
                  <button onClick={() => handleDelete(e.id)} className="p-2 text-red-500 hover:text-red-400 transition"><Trash2 size={20} /></button>
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={4} className="text-center p-8 text-brand-secondary">
                        مفيش أي مصروفات متسجلة للشهر ده.
                    </td>
                </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-brand-gold">
              <td className="p-4 font-black text-xl text-white">الإجمالي</td>
              <td className="p-4 font-black text-xl text-brand-gold font-mono" colSpan={3}>
                ج.م {monthlyTotal.toLocaleString('ar-EG')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title={expenseToEdit ? 'تعديل مصروف' : 'إضافة مصروف جديد'}>
        <ExpenseForm onClose={() => setIsExpenseModalOpen(false)} expenseToEdit={expenseToEdit} />
      </Modal>

    </div>
  );
};

export default ExpensesScreen;