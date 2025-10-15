
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Expense } from '../types';

interface ExpenseFormProps {
  onClose: () => void;
  expenseToEdit?: Expense | null;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onClose, expenseToEdit }) => {
  const { addExpense, updateExpense } = useData();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (expenseToEdit) {
      setDescription(expenseToEdit.description);
      setAmount(String(expenseToEdit.amount));
      setDate(new Date(expenseToEdit.date).toISOString().split('T')[0]);
    } else {
        // Reset form for new entry
        setDescription('');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
    }
  }, [expenseToEdit]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!description.trim()) newErrors.description = 'وصف المصروف مطلوب';
    if (!amount) newErrors.amount = 'المبلغ مطلوب';
    else if (isNaN(Number(amount)) || Number(amount) <= 0) newErrors.amount = 'لازم المبلغ يكون رقم أكبر من صفر';
    if (!date) newErrors.date = 'التاريخ مطلوب';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const expenseData = {
      description,
      amount: Number(amount),
      date,
    };

    if (expenseToEdit) {
      updateExpense({ ...expenseData, id: expenseToEdit.id });
    } else {
      addExpense(expenseData);
    }
    onClose();
  };

  const renderError = (field: string) => errors[field] ? <p className="text-red-400 text-sm mt-1">{errors[field]}</p> : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="description" className="block text-brand-light mb-2">وصف المصروف (مثال: إيجار السنتر)</label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-brand-blue border border-brand-secondary rounded-lg p-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none transition text-white"
        />
        {renderError('description')}
      </div>
      <div>
        <label htmlFor="amount" className="block text-brand-light mb-2">المبلغ</label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-brand-blue border border-brand-secondary rounded-lg p-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none transition text-white"
        />
        {renderError('amount')}
      </div>
      <div>
        <label htmlFor="date" className="block text-brand-light mb-2">تاريخ الصرف</label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-brand-blue border border-brand-secondary rounded-lg p-3 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none transition text-white"
        />
        {renderError('date')}
      </div>
      <div className="flex justify-end gap-4 pt-4">
        <button type="button" onClick={onClose} className="py-2 px-6 rounded-lg bg-brand-secondary text-white hover:bg-opacity-80 transition">
          إلغاء
        </button>
        <button type="submit" className="py-2 px-6 rounded-lg bg-brand-gold text-brand-blue font-bold hover:bg-opacity-90 transition shadow-lg">
          {expenseToEdit ? 'حفظ التعديل' : 'إضافة المصروف'}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;