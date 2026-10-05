import React, { useState } from 'react';
import { CreditCard, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';

export default function PaymentDemo() {
  const [scenario, setScenario] = useState('success');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handlePayment = async () => {
    setLoading(true);
    setResult(null);
    
    let primaryFail = false;
    let secondaryFail = false;
    
    if (scenario === 'fallback') {
      primaryFail = true;
    } else if (scenario === 'fail') {
      primaryFail = true;
      secondaryFail = true;
    }

    try {
      const response = await fetch('http://localhost:3001/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryFail, secondaryFail })
      });
      
      const data = await response.json();
      setResult({
        success: data.success,
        data: data.result,
        error: data.error
      });
    } catch (err) {
      setResult({ success: false, error: 'Error de red al conectar con el backend.' });
    }
    setLoading(false);
  };

  return (
    <div className="demo-container fade-in">
      <div className="card payment-card">
        <h2>Confirmar Reserva de Vuelo</h2>
        <p className="subtitle">Monto a pagar: <strong>$50.000 ARS</strong></p>
        
        <div className="scenarios">
          <h3>Selecciona el escenario para la demostración:</h3>
          <div className="scenario-options">
            <label className={`scenario-option ${scenario === 'success' ? 'selected' : ''}`}>
              <input type="radio" name="scenario" value="success" checked={scenario === 'success'} onChange={() => setScenario('success')} />
              <span>Éxito (MercadoPago)</span>
            </label>
            <label className={`scenario-option ${scenario === 'fallback' ? 'selected' : ''}`}>
              <input type="radio" name="scenario" value="fallback" checked={scenario === 'fallback'} onChange={() => setScenario('fallback')} />
              <span>Falla MercadoPago ➔ Fallback a PayPal</span>
            </label>
            <label className={`scenario-option ${scenario === 'fail' ? 'selected' : ''}`}>
              <input type="radio" name="scenario" value="fail" checked={scenario === 'fail'} onChange={() => setScenario('fail')} />
              <span>Ambos fallan (Error transaccional)</span>
            </label>
          </div>
        </div>

        <button className="pay-btn" onClick={handlePayment} disabled={loading}>
          {loading ? 'Procesando...' : <><CreditCard size={18} /> Procesar Pago Seguro</>}
        </button>

        {result && (
          <div className={`result-box fade-in ${result.success ? 'success' : 'error'}`}>
            {result.success ? (
              <>
                <CheckCircle className="result-icon" />
                <div>
                  <h4>Pago Aprobado</h4>
                  <p>Pasarela utilizada: <strong>{result.data.gateway}</strong></p>
                  <p>ID Transacción: <span>{result.data.transactionId}</span></p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="result-icon" />
                <div>
                  <h4>Pago Rechazado</h4>
                  <p>{result.error}</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      
      <div className="info-card fade-in delay-1">
        <ShieldAlert className="info-icon" />
        <div>
          <h3>¿Cómo funciona esto?</h3>
          <p>Esta demo utiliza el backend real de Node.js implementado para la plataforma Malva-APS.</p>
          <p>El sistema cuenta con un patrón <strong>ResilientPaymentGateway</strong>. Si MercadoPago (Pasarela Principal) falla, el sistema realiza reintentos y, si no responde, redirige la transacción transparentemente hacia PayPal (Pasarela Secundaria) para evitar perder la venta.</p>
        </div>
      </div>
    </div>
  );
}
