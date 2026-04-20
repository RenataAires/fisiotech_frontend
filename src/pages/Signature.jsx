import { useRef, useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import api from '../services/api';

export default function Signature() {
  const navigate = useNavigate();
  const { id: sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient');

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleConfirm = async () => {
    if (!hasSignature) {
      setError('Por favor, peça ao paciente para assinar.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const canvas = canvasRef.current;
      const signatureData = canvas.toDataURL('image/png');

      await api.patch(`/api/sessions/${sessionId}/sign`, {
        signature: signatureData,
      });

      navigate(`/patients/${patientId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar assinatura');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">

      <div className="bg-white shadow px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(`/patients/${patientId}`)}
          className="text-gray-500 text-xl">←</button>
        <div>
          <h1 className="font-bold text-gray-800">Assinatura do Paciente</h1>
          <p className="text-xs text-gray-400">Confirma que a sessão foi realizada</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-sm text-blue-800 font-medium">
            📱 Entregue o celular ao paciente
          </p>
          <p className="text-sm text-blue-600 mt-1">
            Peça para ele assinar com o dedo no espaço abaixo para confirmar que a sessão foi realizada.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-sm text-gray-500 text-center mb-3">
            Assine abaixo
          </p>
          <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden">
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              className="w-full touch-none cursor-crosshair"
              style={{ height: '200px' }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-gray-400">
              {hasSignature ? '✅ Assinatura capturada' : 'Nenhuma assinatura ainda'}
            </p>
            <button onClick={clearSignature}
              className="text-xs text-red-500 hover:text-red-700">
              Limpar
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div className="space-y-3">
          <button onClick={handleConfirm} disabled={saving || !hasSignature}
            className="w-full bg-green-600 hover:bg-green-700 text-white
                       font-semibold rounded-xl py-4 transition disabled:opacity-50">
            {saving ? 'Salvando...' : '✅ Confirmar Assinatura'}
          </button>
          <button onClick={() => navigate(`/patients/${patientId}`)}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700
                       font-semibold rounded-xl py-3 transition text-sm">
            Pular por agora
          </button>
        </div>

      </div>
    </div>
  );
}