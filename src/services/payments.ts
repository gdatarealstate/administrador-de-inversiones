import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import type { Payment } from "@/types/domain";

const paymentsCollection = collection(db, "payments");

export async function listPayments(): Promise<Payment[]> {
  const snapshot = await getDocs(paymentsCollection);
  return snapshot.docs.map((entry) => entry.data() as Payment);
}

export interface CreatePaymentInput {
  contractId: string;
  investorName: string;
  date: string;
  amount: number;
  method: Payment["method"];
  type: Payment["type"];
  balanceBefore: number;
  balanceAfter: number;
  paymentProof: File;
}

const receiptCurrencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

function buildReceiptHtml(input: {
  paymentId: string;
  contractId: string;
  investorName: string;
  date: string;
  amount: number;
  method: Payment["method"];
  type: Payment["type"];
  balanceBefore: number;
  balanceAfter: number;
}) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Recibo ${input.paymentId}</title>
    <style>
      :root {
        color-scheme: light;
      }
      body {
        margin: 0;
        padding: 24px;
        font-family: Arial, Helvetica, sans-serif;
        color: #0f172a;
        background: #f8fafc;
      }
      .receipt {
        max-width: 760px;
        margin: 0 auto;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        overflow: hidden;
      }
      .header {
        padding: 24px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
      }
      .brand {
        font-size: 20px;
        font-weight: 700;
        letter-spacing: 0.4px;
      }
      .subtitle {
        margin-top: 6px;
        font-size: 12px;
        color: #475569;
      }
      .receipt-id {
        text-align: right;
      }
      .receipt-id h1 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
      }
      .receipt-id p {
        margin: 6px 0 0;
        font-size: 12px;
        color: #475569;
      }
      .content {
        padding: 24px;
      }
      .section-title {
        margin: 0 0 10px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: #64748b;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px 24px;
      }
      .field {
        border-bottom: 1px dashed #e2e8f0;
        padding-bottom: 8px;
      }
      .label {
        display: block;
        font-size: 11px;
        color: #64748b;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .value {
        font-size: 14px;
        font-weight: 600;
        color: #0f172a;
      }
      .amount-box {
        margin-top: 20px;
        padding: 16px;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        background: #f8fafc;
      }
      .amount-box .label {
        margin-bottom: 8px;
      }
      .amount {
        font-size: 30px;
        font-weight: 700;
        letter-spacing: 0.5px;
      }
      .footer {
        margin-top: 20px;
        padding-top: 14px;
        border-top: 1px solid #e2e8f0;
        font-size: 12px;
        color: #475569;
        line-height: 1.5;
      }
      .legal-note {
        margin-top: 10px;
        font-size: 11px;
        color: #64748b;
      }
      @media (max-width: 640px) {
        body {
          padding: 12px;
        }
        .header, .content {
          padding: 16px;
        }
        .grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <article class="receipt">
      <header class="header">
        <div>
          <div class="brand">HGH CONSULTORIA EMPRESARIAL</div>
          <p class="subtitle">Recibo de pago emitido por la plataforma</p>
        </div>
        <div class="receipt-id">
          <h1>RECIBO</h1>
          <p>No. ${input.paymentId}</p>
          <p>Fecha: ${input.date}</p>
        </div>
      </header>
      <section class="content">
        <h2 class="section-title">Detalle de la operación</h2>
        <div class="grid">
          <div class="field">
            <span class="label">Contrato</span>
            <span class="value">${input.contractId}</span>
          </div>
          <div class="field">
            <span class="label">Inversionista</span>
            <span class="value">${input.investorName}</span>
          </div>
          <div class="field">
            <span class="label">Tipo de pago</span>
            <span class="value">${input.type}</span>
          </div>
          <div class="field">
            <span class="label">Método de pago</span>
            <span class="value">${input.method}</span>
          </div>
          <div class="field">
            <span class="label">Saldo antes</span>
            <span class="value">${receiptCurrencyFormatter.format(input.balanceBefore)}</span>
          </div>
          <div class="field">
            <span class="label">Saldo después</span>
            <span class="value">${receiptCurrencyFormatter.format(input.balanceAfter)}</span>
          </div>
        </div>

        <div class="amount-box">
          <span class="label">Monto recibido</span>
          <div class="amount">${receiptCurrencyFormatter.format(input.amount)}</div>
        </div>

        <div class="footer">
          Este documento acredita el registro del pago realizado en la fecha indicada.
          <p class="legal-note">
            Comprobante generado automáticamente por el sistema.
          </p>
        </div>
      </section>
    </article>
  </body>
</html>`;
}

async function uploadReceiptFile(input: {
  paymentId: string;
  contractId: string;
  investorName: string;
  date: string;
  amount: number;
  method: Payment["method"];
  type: Payment["type"];
  balanceBefore: number;
  balanceAfter: number;
}) {
  const content = buildReceiptHtml(input);
  const blob = new Blob([content], { type: "text/html;charset=utf-8" });
  const receiptRef = ref(storage, `recibos/${input.paymentId}.html`);
  await uploadBytes(receiptRef, blob);
  return getDownloadURL(receiptRef);
}

export async function createPayment(input: CreatePaymentInput): Promise<Payment> {
  const id = `PAY-${Date.now()}`;
  const fileExt = input.paymentProof.name.split(".").pop() ?? "bin";
  const proofRef = ref(storage, `comprobantes/${id}.${fileExt}`);
  await uploadBytes(proofRef, input.paymentProof);
  const comprobanteUrl = await getDownloadURL(proofRef);
  const reciboUrl = await uploadReceiptFile({
    paymentId: id,
    contractId: input.contractId,
    investorName: input.investorName,
    date: input.date,
    amount: input.amount,
    method: input.method,
    type: input.type,
    balanceBefore: input.balanceBefore,
    balanceAfter: input.balanceAfter,
  });

  const payment: Payment = {
    id,
    contractId: input.contractId,
    investorName: input.investorName,
    date: input.date,
    amount: input.amount,
    method: input.method,
    type: input.type,
    balanceBefore: input.balanceBefore,
    balanceAfter: input.balanceAfter,
    comprobanteUrl,
    reciboUrl,
  };

  await setDoc(doc(db, "payments", id), payment);
  return payment;
}
