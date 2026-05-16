"use client";
import { useState, useCallback } from "react";
import {
  Receipt,
  Info,
  RotateCcw,
  Copy,
  Check,
  IndianRupee,
} from "lucide-react";

const GST_SLABS = [0, 5, 12, 18, 28];

type TaxType = "exclusive" | "inclusive";

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function parseNum(val: string) {
  const n = parseFloat(val.replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
}

export default function GSTCalculatorClient() {
  const [amount, setAmount] = useState("");
  const [gstRate, setGstRate] = useState(18);
  const [taxType, setTaxType] = useState<TaxType>("exclusive");
  const [copied, setCopied] = useState(false);

  const numAmount = parseNum(amount);
  const rate = gstRate / 100;

  let baseAmount = 0;
  let gstAmount = 0;
  let totalAmount = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (numAmount > 0) {
    if (taxType === "exclusive") {
      baseAmount = numAmount;
      gstAmount = baseAmount * rate;
      totalAmount = baseAmount + gstAmount;
    } else {
      totalAmount = numAmount;
      baseAmount = totalAmount / (1 + rate);
      gstAmount = totalAmount - baseAmount;
    }
    cgst = igst = gstAmount / 2;
    sgst = gstAmount / 2;
  }

  const handleCopy = useCallback(() => {
    const text = `GST Calculation\nAmount: ${formatINR(baseAmount)}\nGST (${gstRate}%): ${formatINR(gstAmount)}\nTotal: ${formatINR(totalAmount)}\nCGST: ${formatINR(cgst)} | SGST: ${formatINR(sgst)}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [baseAmount, gstAmount, totalAmount, cgst, sgst, gstRate]);

  const handleReset = () => {
    setAmount("");
    setGstRate(18);
    setTaxType("exclusive");
  };

  const hasResult = numAmount > 0;

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Input panel */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 lg:p-7">
          <h2 className="font-display font-bold text-lg text-ink-800 mb-6">
            Enter Details
          </h2>

          {/* Amount */}
          <div className="mb-5">
            <label htmlFor="amount" className="label">
              Amount (₹)
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="input-field pl-10"
                aria-label="Amount in rupees"
              />
            </div>
          </div>

          {/* GST Slabs */}
          <div className="mb-5">
            <label className="label">GST Rate</label>
            <div className="grid grid-cols-5 gap-2">
              {GST_SLABS.map((slab) => (
                <button
                  key={slab}
                  onClick={() => setGstRate(slab)}
                  aria-pressed={gstRate === slab}
                  className={`py-2.5 rounded-xl text-sm font-display font-semibold transition-all duration-150 ${
                    gstRate === slab
                      ? "bg-zest-500 text-white shadow-glow-sm"
                      : "bg-gray-50 text-ink-600 border border-gray-100 hover:bg-gray-100"
                  }`}
                >
                  {slab}%
                </button>
              ))}
            </div>
            {/* Custom rate */}
            <div className="mt-3">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={gstRate}
                onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                placeholder="Custom %"
                className="input-field text-sm"
                aria-label="Custom GST rate percentage"
              />
            </div>
          </div>

          {/* Tax Type */}
          <div className="mb-6">
            <label className="label">Price Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(["exclusive", "inclusive"] as TaxType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setTaxType(type)}
                  aria-pressed={taxType === type}
                  className={`py-3 rounded-xl text-sm font-display font-semibold capitalize transition-all ${
                    taxType === type
                      ? "bg-ink-800 text-white"
                      : "bg-gray-50 text-ink-600 border border-gray-100 hover:bg-gray-100"
                  }`}
                >
                  {type === "exclusive" ? "Excl. GST" : "Incl. GST"}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2 flex items-start gap-1.5">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              {taxType === "exclusive"
                ? "Price before GST is added."
                : "Price already includes GST."}
            </p>
          </div>

          {/* Actions */}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Result panel */}
      <div className="lg:col-span-3 space-y-4">
        {/* Main result card */}
        <div
          className={`rounded-2xl border p-6 lg:p-8 transition-all duration-300 ${
            hasResult
              ? "bg-ink-900 border-ink-700 shadow-glow-sm"
              : "bg-gray-50 border-gray-100"
          }`}
        >
          {hasResult ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-display font-semibold uppercase tracking-wider text-white/40">
                  Calculation Result
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
                  aria-label="Copy results"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-glow" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-sm text-white/50">Original Amount</span>
                  <span className="font-display font-semibold text-white text-lg">
                    {formatINR(baseAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-sm text-white/50">
                    GST Amount ({gstRate}%)
                  </span>
                  <span className="font-display font-semibold text-zest-400 text-lg">
                    {formatINR(gstAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-4 bg-white/5 rounded-xl px-4 -mx-2">
                  <span className="text-sm font-semibold text-white">
                    Total Amount
                  </span>
                  <span className="font-display font-extrabold text-glow text-2xl">
                    {formatINR(totalAmount)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                Enter an amount to see the calculation
              </p>
            </div>
          )}
        </div>

        {/* CGST / SGST / IGST breakdown */}
        {hasResult && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
            <h3 className="font-display font-semibold text-sm text-ink-700 mb-4 uppercase tracking-wider">
              Tax Breakdown
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "CGST",
                  value: cgst,
                  sub: "Central GST",
                  color: "border-violet-100 bg-violet-50",
                },
                {
                  label: "SGST",
                  value: sgst,
                  sub: "State GST",
                  color: "border-blue-100 bg-blue-50",
                },
                {
                  label: "IGST",
                  value: igst * 2,
                  sub: "Interstate",
                  color: "border-emerald-100 bg-emerald-50",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-xl border p-4 ${item.color}`}
                >
                  <div className="text-xs font-display font-bold uppercase tracking-wider text-gray-500 mb-1">
                    {item.label}
                  </div>
                  <div className="font-display font-bold text-ink-800 text-base">
                    {formatINR(item.value)}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {item.sub}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3 flex items-start gap-1.5">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              CGST + SGST applies for intra-state transactions. IGST applies for
              inter-state transactions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
