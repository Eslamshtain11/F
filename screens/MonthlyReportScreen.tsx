import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { Payment } from '../types';
import Modal from '../components/Modal';
import PaymentForm from '../components/PaymentForm';
import { Edit, Trash2, PlusCircle, Search, FileDown, BrainCircuit } from 'lucide-react';
import { exportToXLSX, exportMonthlyReportToPDF } from '../services/exportService';
import { generateMonthlyAnalysis } from '../services/aiService';


const MonthlyReportScreen: React.FC = () => {
  const { payments, deletePayment } = useData();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);


  const availableMonths = useMemo(() => {
    const months = new Set(payments.map(p => p.date.slice(0, 7)));
    const currentMonth = new Date().toISOString().slice(0, 7);
    months.add(currentMonth);
    return Array.from(months).sort().reverse();
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments
      .filter(p => p.date.startsWith(selectedMonth))
      .filter(p => 
        p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.groupName.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [payments, selectedMonth, searchTerm]);

  const monthlyTotal = useMemo(() => {
    return filteredPayments.reduce((acc, p) => acc + p.amount, 0);
  }, [filteredPayments]);

  const handleEdit = (payment: Payment) => {
    setPaymentToEdit(payment);
    setIsPaymentModalOpen(true);
  };

  const handleAddNew = () => {
    setPaymentToEdit(null);
    setIsPaymentModalOpen(true);
  };

  // FIX: The deletePayment function is async, so it should be awaited to ensure the state updates correctly after the operation completes.
  const handleDelete = async (id: string) => {
    if (window.confirm('متأكد إنك عايز تمسح الدفعة دي؟')) {
      await deletePayment(id);
    }
  };
  
  const handleExportXLSX = useCallback(() => {
      exportToXLSX(filteredPayments, `كشف-حساب-${selectedMonth}`);
  }, [filteredPayments, selectedMonth]);

  const handleExportPDF = useCallback(() => {
      const monthName = new Date(selectedMonth + '-02').toLocaleString('ar-EG', { month: 'long', year: 'numeric' });
      exportMonthlyReportToPDF(filteredPayments, monthName, monthlyTotal);
  }, [filteredPayments, selectedMonth, monthlyTotal]);

  const handleAiAnalysis = async () => {
    if (!filteredPayments.length) {
      alert('لا توجد بيانات كافية للتحليل في هذا الشهر.');
      return;
    }
    setIsAnalyzing(true);
    setAiAnalysisResult('');

    try {
      const monthName = new Date(selectedMonth + '-02').toLocaleString('ar-EG', { month: 'long', year: 'numeric' });
      
      const groupSummary = filteredPayments.reduce((acc, p) => {
          acc[p.groupName] = (acc[p.groupName] || 0) + p.amount;
          return acc;
      }, {} as {[key: string]: number});
      
      const summaryText = `
        - إجمالي الدخل: ${monthlyTotal.toLocaleString('ar-EG')} جنيه
        - عدد الدفعات: ${filteredPayments.length} دفعة
        - توزيع الدخل على المجموعات: ${Object.entries(groupSummary).map(([name, total]) => `${name}: ${total.toLocaleString('ar-EG')} جنيه`).join('، ')}
      `;

      const analysisText = await generateMonthlyAnalysis(summaryText, monthName);
      
      setAiAnalysisResult(analysisText);
      setIsAnalysisModalOpen(true);

    } catch (error: any) {
      console.error("Error with AI analysis:", error);
      alert(error.message || "حدث خطأ أثناء محاولة التحليل. الرجاء المحاولة مرة أخرى.");
    } finally {
      setIsAnalyzing(false);
    }
  };


  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl font-black text-white">كشف الحساب الشهري</h1>
        <p className="text-brand-secondary mt-2">هنا تقدر تشوف وتسجل كل المدفوعات وتعدلها.</p>
      </header>

      <div className="bg-brand-navy p-4 rounded-xl shadow-lg flex flex-col md:flex-row md:items-center gap-4 flex-wrap">
        <button
          onClick={handleAddNew}
          className="bg-brand-gold text-brand-blue font-bold py-3 px-5 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition shadow-md flex-shrink-0"
        >
          <PlusCircle size={20} />
          إضافة دفعة جديدة
        </button>
        <div className="relative flex-grow min-w-[200px]">
          <input
            type="text"
            placeholder="دور على طالب أو مجموعة..."
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
        <div className="flex gap-2 flex-shrink-0">
            <button onClick={handleExportXLSX} className="bg-green-700 text-white p-3 rounded-lg hover:bg-green-600 transition flex items-center gap-2" aria-label="تصدير إلى Excel"><FileDown size={20}/> .xlsx</button>
            <button onClick={handleExportPDF} className="bg-red-700 text-white p-3 rounded-lg hover:bg-red-600 transition flex items-center gap-2" aria-label="تصدير إلى PDF"><FileDown size={20}/> .pdf</button>
            <button 
                onClick={handleAiAnalysis} 
                disabled={isAnalyzing}
                className="bg-purple-700 text-white p-3 rounded-lg hover:bg-purple-600 transition flex items-center gap-2 disabled:bg-gray-500"
                aria-label="تحليل ذكي للبيانات"
            >
                <BrainCircuit size={20}/> {isAnalyzing ? 'جاري التحليل...' : 'تحليل ذكي'}
            </button>
        </div>
      </div>
      
      <div className="bg-brand-navy p-2 md:p-4 rounded-xl shadow-lg overflow-x-auto">
        <table className="w-full min-w-[600px] text-right">
          <thead className="border-b-2 border-brand-gold/20">
            <tr>
              <th className="p-4 text-brand-gold font-bold">اسم الطالب</th>
              <th className="p-4 text-brand-gold font-bold">المجموعة</th>
              <th className="p-4 text-brand-gold font-bold">المبلغ المدفوع</th>
              <th className="p-4 text-brand-gold font-bold">التاريخ</th>
              <th className="p-4 text-brand-gold font-bold text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length > 0 ? filteredPayments.map(p => (
              <tr key={p.id} className="border-b border-white/10 hover:bg-white/5">
                <td className="p-4 text-white font-semibold">{p.studentName}</td>
                <td className="p-4 text-brand-secondary">{p.groupName}</td>
                <td className="p-4 font-mono text-brand-light">ج.م {p.amount.toLocaleString('ar-EG')}</td>
                <td className="p-4 text-brand-secondary">{new Date(p.date).toLocaleDateString('ar-EG')}</td>
                <td className="p-4 flex justify-center items-center gap-2">
                  <button onClick={() => handleEdit(p)} className="p-2 text-blue-400 hover:text-blue-300 transition" aria-label={`تعديل دفعة ${p.studentName}`}><Edit size={20} /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-red-500 hover:text-red-400 transition" aria-label={`حذف دفعة ${p.studentName}`}><Trash2 size={20} /></button>
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={5} className="text-center p-8 text-brand-secondary">
                        مفيش أي مدفوعات متسجلة للشهر ده.
                    </td>
                </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-brand-gold">
              <td className="p-4 font-black text-xl text-white" colSpan={2}>الإجمالي</td>
              <td className="p-4 font-black text-xl text-brand-gold font-mono" colSpan={3}>
                ج.م {monthlyTotal.toLocaleString('ar-EG')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={paymentToEdit ? 'تعديل دفعة' : 'إضافة دفعة جديدة'}>
        <PaymentForm onClose={() => setIsPaymentModalOpen(false)} paymentToEdit={paymentToEdit} />
      </Modal>

      <Modal isOpen={isAnalysisModalOpen} onClose={() => setIsAnalysisModalOpen(false)} title="تحليل الذكاء الاصطناعي">
        <div className="text-right text-brand-light space-y-4 max-h-[60vh] overflow-y-auto p-2 bg-brand-blue rounded">
            <pre className="whitespace-pre-wrap font-sans">{aiAnalysisResult}</pre>
        </div>
      </Modal>

    </div>
  );
};

export default MonthlyReportScreen;