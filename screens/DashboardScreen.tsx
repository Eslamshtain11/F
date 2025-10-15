
import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Screen } from '../types';
import StatCard from '../components/StatCard';
import { DollarSign, TrendingUp, TrendingDown, Users, Calendar, PlusCircle, ClipboardList, AlertTriangle, Clock, Settings, Save } from 'lucide-react';

interface DashboardScreenProps {
  setScreen: (screen: Screen) => void;
}

// FIX: Correctly type the component props to accept `setScreen`.
const DashboardScreen: React.FC<DashboardScreenProps> = ({ setScreen }) => {
  const { payments, expenses, reminderPeriod, setReminderPeriod } = useData();
  const [localReminder, setLocalReminder] = useState(String(reminderPeriod));
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    setLocalReminder(String(reminderPeriod));
  }, [reminderPeriod]);

  const availableMonths = useMemo(() => {
    const paymentMonths = payments.map(p => p.date.slice(0, 7));
    const expenseMonths = expenses.map(e => e.date.slice(0, 7));
    const allMonths = new Set([...paymentMonths, ...expenseMonths]);
    const currentMonth = new Date().toISOString().slice(0, 7);
    allMonths.add(currentMonth);
    return Array.from(allMonths).sort().reverse();
  }, [payments, expenses]);

  const { incomeForMonth, expensesForMonth, netIncomeForMonth, studentsInMonth } = useMemo(() => {
    const monthlyPayments = payments.filter(p => p.date.startsWith(selectedMonth));
    const monthlyExpenses = expenses.filter(e => e.date.startsWith(selectedMonth));
    
    const income = monthlyPayments.reduce((acc, p) => acc + p.amount, 0);
    const expenseTotal = monthlyExpenses.reduce((acc, e) => acc + e.amount, 0);
    
    const studentSet = new Set(monthlyPayments.map(p => p.studentName.trim()));

    return {
      incomeForMonth: income,
      expensesForMonth: expenseTotal,
      netIncomeForMonth: income - expenseTotal,
      studentsInMonth: studentSet.size,
    };
  }, [payments, expenses, selectedMonth]);
  
  const { upcomingPayments, overduePayments } = useMemo(() => {
    const studentLastPayment: { [key: string]: { date: Date, groupName: string } } = {};

    payments.forEach(p => {
      const paymentDate = new Date(p.date);
      if (paymentDate > new Date()) return;
      
      const studentName = p.studentName.trim();
      if (!studentLastPayment[studentName] || paymentDate > studentLastPayment[studentName].date) {
        studentLastPayment[studentName] = { date: paymentDate, groupName: p.groupName };
      }
    });

    const upcoming: { name: string, groupName: string, dueDate: Date, days: number }[] = [];
    const overdue: { name: string, groupName: string, dueDate: Date, days: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    Object.entries(studentLastPayment).forEach(([name, lastPaymentInfo]) => {
      const dueDate = new Date(lastPaymentInfo.date);
      dueDate.setMonth(dueDate.getMonth() + 1);
      dueDate.setHours(0, 0, 0, 0);

      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        overdue.push({ name, groupName: lastPaymentInfo.groupName, dueDate, days: Math.abs(diffDays) });
      } else if (diffDays <= reminderPeriod) {
        upcoming.push({ name, groupName: lastPaymentInfo.groupName, dueDate, days: diffDays });
      }
    });
    
    overdue.sort((a, b) => b.days - a.days);
    upcoming.sort((a, b) => a.days - b.days);

    return { upcomingPayments: upcoming, overduePayments: overdue };
  }, [payments, reminderPeriod]);


  const handleReminderChange = () => {
    const days = parseInt(localReminder, 10);
    if (!isNaN(days) && days >= 0) {
        setReminderPeriod(days);
        alert('تم حفظ الإعدادات');
    } else {
        alert('من فضلك أدخل رقم صحيح');
    }
  };

  const formatCurrency = (amount: number) => {
    return `ج.م ${amount.toLocaleString('ar-EG')}`;
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white">لوحة التحكم الرئيسية</h1>
          <p className="text-brand-secondary mt-2">نظرة سريعة على حساباتك يا مستر إسلام.</p>
        </div>
        <div className="flex items-center gap-2">
            <label htmlFor="month-select" className="text-brand-light">عرض بيانات شهر:</label>
             <select
                id="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-brand-navy border border-brand-secondary rounded-lg p-2 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none transition text-white"
             >
                {availableMonths.map(month => (
                    <option key={month} value={month}>{new Date(month + '-02').toLocaleString('ar-EG', { month: 'long', year: 'numeric' })}</option>
                ))}
            </select>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="صافي الدخل للشهر" value={formatCurrency(netIncomeForMonth)} icon={<DollarSign />} />
        <StatCard title="إجمالي الدخل للشهر" value={formatCurrency(incomeForMonth)} icon={<TrendingUp />} />
        <StatCard title="إجمالي المصروفات للشهر" value={formatCurrency(expensesForMonth)} icon={<TrendingDown />} />
        <StatCard title="عدد الطلاب" value={studentsInMonth} description="الطلاب اللي دفعوا في الشهر ده" icon={<Users />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        <button 
          onClick={() => setScreen(Screen.MONTHLY_REPORT)} 
          className="bg-brand-gold text-brand-blue p-6 rounded-xl flex items-center justify-center text-xl font-bold gap-4 hover:opacity-90 transition-transform hover:scale-105 shadow-lg"
        >
          <PlusCircle size={32} />
          <span>إضافة دفعة جديدة</span>
        </button>
        <button 
          onClick={() => setScreen(Screen.MONTHLY_REPORT)}
          className="bg-brand-navy border-2 border-brand-gold text-brand-gold p-6 rounded-xl flex items-center justify-center text-xl font-bold gap-4 hover:bg-brand-gold/10 transition-transform hover:scale-105"
        >
          <ClipboardList size={32} />
          <span>عرض كشف الحساب</span>
        </button>
      </div>

       <div className="pt-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4 flex-wrap">
           <div>
            <h2 className="text-3xl font-bold text-white">حالة الدفع للطلاب</h2>
            <p className="text-xs text-brand-secondary">(بناءً على تاريخ اليوم)</p>
           </div>
            <div className="flex items-center gap-2 bg-brand-navy p-2 rounded-lg">
                <Settings className="text-brand-gold" />
                <label htmlFor="reminder-days" className="text-sm text-brand-secondary whitespace-nowrap">تذكير قبل:</label>
                <input
                    id="reminder-days"
                    type="number"
                    value={localReminder}
                    onChange={(e) => setLocalReminder(e.target.value)}
                    className="w-16 bg-brand-blue border border-brand-secondary rounded p-1 text-center text-white"
                    aria-label="فترة التذكير بالأيام"
                />
                <span className="text-sm text-brand-secondary">أيام</span>
                <button onClick={handleReminderChange} className="bg-brand-gold text-brand-blue p-2 rounded-lg hover:opacity-90 transition" aria-label="حفظ فترة التذكير">
                  <Save size={18} />
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-brand-navy p-4 md:p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2"><AlertTriangle /> مستحقات متأخرة ({overduePayments.length})</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {overduePayments.length > 0 ? overduePayments.map(student => (
                        <div key={student.name + student.dueDate} className="bg-brand-blue p-4 rounded-lg border-r-4 border-red-500">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-white">{student.name}</p>
                                    <p className="text-sm text-brand-secondary">{student.groupName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-red-400">متأخر {student.days} أيام</p>
                                    <p className="text-xs text-brand-secondary">كان يوم {student.dueDate.toLocaleDateString('ar-EG')}</p>
                                </div>
                            </div>
                        </div>
                    )) : <p className="text-brand-secondary text-center py-10">تمام! لا يوجد أي متأخرات.</p>}
                </div>
            </div>

            <div className="bg-brand-navy p-4 md:p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-bold text-brand-gold mb-4 flex items-center gap-2"><Clock /> مستحقات قادمة ({upcomingPayments.length})</h3>
                 <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {upcomingPayments.length > 0 ? upcomingPayments.map(student => (
                        <div key={student.name + student.dueDate} className="bg-brand-blue p-4 rounded-lg border-r-4 border-brand-gold">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-white">{student.name}</p>
                                    <p className="text-sm text-brand-secondary">{student.groupName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-yellow-400">{student.days === 0 ? 'اليوم' : `متبقي ${student.days} أيام`}</p>
                                    <p className="text-xs text-brand-secondary">الميعاد يوم {student.dueDate.toLocaleDateString('ar-EG')}</p>
                                </div>
                            </div>
                        </div>
                    )) : <p className="text-brand-secondary text-center py-10">لا توجد مستحقات قادمة في الفترة المحددة.</p>}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;