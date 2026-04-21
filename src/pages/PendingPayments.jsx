import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function PendingPayments() {
  const navigate = useNavigate();
  const [pendencies, setPendencies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPendencies = async () => {
    try {
      const res = await api.get("/api/payments/pending");
      setPendencies(res.data);
    } catch (err) {
      console.error("Erro ao carregar pendências:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendencies();
  }, []);

  const handleRegisterPayment = async (session) => {
    const amount = window.prompt(`Valor recebido de ${session.patient_name}:`, "150.00");
    if (!amount) return;

    const method = window.prompt("Método de pagamento (Pix, Dinheiro, Cartão):", "Pix");
    if (!method) return;

    try {
      await api.post("/api/payments", {
        patient_id: session.patient_id,
        treatment_plan_id: session.treatment_plan_id,
        session_id: session.session_id,
        amount: parseFloat(amount),
        payment_method: method,
        payment_date: new Date().toISOString().split('T')[0],
        notes: "Baixa manual via painel de pendências"
      });
      
      alert("Pagamento registrado!");
      fetchPendencies(); // Atualiza a lista
    } catch (err) {
      alert("Erro ao registrar pagamento.");
    }
  };

  if (loading) return <div className="p-10 text-center">Carregando pendências...</div>;

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <div className="bg-white shadow px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="text-gray-500 text-xl">←</button>
        <h1 className="font-bold text-gray-800">Pagamentos Pendentes</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {pendencies.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p className="text-4xl mb-2">🎉</p>
            <p>Tudo em dia! Nenhum pagamento pendente.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendencies.map((item) => (
              <div key={item.session_id} className="bg-white rounded-2xl shadow p-4 border-l-4 border-red-400">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-800">{item.patient_name}</p>
                    <p className="text-xs text-gray-500">{item.plan_title}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Sessão {item.session_number} · {new Date(item.session_date).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleRegisterPayment(item)}
                    className="bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    DAR BAIXA
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}