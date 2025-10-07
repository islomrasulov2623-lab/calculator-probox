import { useMemo, useState } from "react";

// === Helper: format currency in so'm ===
const fmt = (n) =>
  isNaN(n)
    ? "—"
    : new Intl.NumberFormat("uz-UZ").format(Math.round(Number(n)));

// Default month -> markup % table (B2C) from your policy
const DEFAULT_RATES = {
  1: 5,
  2: 10,
  3: 17,
  4: 25,
  5: 35,
  6: 38,
  7: 43,
  8: 47,
  9: 50,
  10: 55,
  11: 58,
  12: 63,
  13: 65,
  14: 68,
  15: 70,
};

export default function SomInstallmentCalculator() {
  const [price, setPrice] = useState(0); // so'm
  const [down, setDown] = useState(0); // so'm
  const [months, setMonths] = useState(0); // oy
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [editing, setEditing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Limit modes
  const [limitMode, setLimitMode] = useState(false); // monthly payment limit mode
  const [monthlyLimit, setMonthlyLimit] = useState(1_000_000);

  const [yearlyMode, setYearlyMode] = useState(false); // yearly credit limit mode
  const [yearlyLimit, setYearlyLimit] = useState(12_000_000);
  const [usedThisYear, setUsedThisYear] = useState(0);

  // Derived values
  const ratePct = months ? (rates[months] ?? 0) : 0;

  // Annual limit logic
  const available = Math.max(0, Number(yearlyLimit) - Number(usedThisYear));
  const requiredDownYearly = Math.max(0, Number(price) - available);

  // Applied down depends on selected mode
  const appliedDown = yearlyMode
    ? clamp(requiredDownYearly, 0, Number(price))
    : limitMode && months
    ? clamp(
        Number(price) - (Number(monthlyLimit) * months) / (1 + ratePct / 100),
        0,
        Number(price)
      )
    : Number(down);

  const financed = Math.max(0, Number(price) - appliedDown);
  const fee = (financed * ratePct) / 100;
  const repayTotal = financed + fee; // faqat bo'lib-bo'lib qismi
  const monthly = months ? repayTotal / months : 0;
  const displayMonthly = yearlyMode ? monthly : limitMode ? Number(monthlyLimit) : monthly;
  const grandTotal = repayTotal + appliedDown; // boshlang'ich + bo'lib-bo'lib jami

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => i + 1).map((m) => ({
        value: m,
        label: `${m} oy`,
      })),
    []
  );

  return (
    <div className="min-h-screen w-full bg-neutral-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-neutral-200">
        <div className="bg-red-500 h-2 rounded-t-3xl" />
        <div className="p-6 md:p-8 space-y-6">
          {/* Header */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center text-white font-bold">
                PB
              </div>
              <h1 className="text-xl font-semibold">Muddatli to‘lov kalkulyatori</h1>
            </div>
            <button
              onClick={() => setEditing((v) => !v)}
              className="text-sm px-3 py-1.5 rounded-lg border shadow-sm hover:bg-neutral-50"
            >
              {editing ? "Yopish" : "Stavkalar"}
            </button>
          </header>

          {/* Inputs */}
          <div className="grid grid-cols-1 gap-4">
            {/* Mode toggles */}
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={yearlyMode}
                  onChange={(e) => {
                    setYearlyMode(e.target.checked);
                    if (e.target.checked) setLimitMode(false);
                  }}
                />
                <span className="text-sm text-neutral-700">Yillik limit rejimi (ustun)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={limitMode}
                  onChange={(e) => {
                    setLimitMode(e.target.checked);
                    if (e.target.checked) setYearlyMode(false);
                  }}
                />
                <span className="text-sm text-neutral-700">Oylik limit rejimi</span>
              </label>
            </div>

            {/* Price */}
            <LabeledInput
              label="Mahsulot narxi (so'm)"
              placeholder="masalan, 12 500 000"
              value={price}
              onChange={(v) => setPrice(sanitizeInt(v))}
            />

            {/* Conditional blocks */}
            {yearlyMode ? (
              <>
                <LabeledInput
                  label="Yillik limit (so'm)"
                  placeholder="masalan, 12 000 000"
                  value={yearlyLimit}
                  onChange={(v) => setYearlyLimit(sanitizeInt(v))}
                />
                <LabeledInput
                  label="Ushbu yilda ishlatilgan (so'm)"
                  placeholder="masalan, 0"
                  value={usedThisYear}
                  onChange={(v) => setUsedThisYear(sanitizeInt(v))}
                />
                <LabeledInput
                  label="Kerakli boshlang'ich (hisoblangan)"
                  value={Math.round(appliedDown)}
                  onChange={() => {}}
                  readOnly
                />
              </>
            ) : limitMode ? (
              <>
                <LabeledInput
                  label="Oylik to'lov limiti (so'm)"
                  placeholder="masalan, 1 000 000"
                  value={monthlyLimit}
                  onChange={(v) => setMonthlyLimit(sanitizeInt(v))}
                />
                <LabeledInput
                  label="Kerakli boshlang'ich (hisoblangan)"
                  value={Math.round(appliedDown)}
                  onChange={() => {}}
                  readOnly
                />
              </>
            ) : (
              <LabeledInput
                label="Boshlang'ich to'lov (so'm)"
                placeholder="masalan, 2 000 000"
                value={down}
                onChange={(v) => setDown(sanitizeInt(v))}
              />
            )}

            {/* Months */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-neutral-600">Muddat</label>
              <select
                className="rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
              >
                <option value={0}>Muddatni tanlang</option>
                {monthOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 gap-3">
            <StatRow label="Oylik to'lov" value={`${fmt(displayMonthly)} so'm`} big />
            <StatRow label="Umumiy (boshlang'ich bilan)" value={`${fmt(grandTotal)} so'm`} />
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowDetails((v) => !v)}
              className="mt-2 text-sm px-3 py-1.5 rounded-lg border shadow-sm hover:bg-neutral-50"
            >
              {showDetails ? "Tafsilotlarni yashirish" : "Tafsilotlarni ko‘rsatish"}
            </button>
          </div>

          {showDetails && (
            <div className="grid grid-cols-1 gap-3">
              <div className="h-px bg-neutral-200" />
              <StatRow label="Moliyalashtiriladigan summa" value={`${fmt(financed)} so'm`} />
              <StatRow label={`Ustama (${ratePct}%)`} value={`${fmt(fee)} so'm`} />
              <StatRow label="Bo'lib-bo'lib jami" value={`${fmt(repayTotal)} so'm`} />
            </div>
          )}

          {/* Warnings */}
          {appliedDown > price && (
            <p className="text-sm text-red-600">Boshlang'ich to'lov mahsulot narxidan oshmasin.</p>
          )}

          {/* Rates editor */}
          {editing && <RatesEditor rates={rates} setRates={setRates} />}

          <footer className="text-xs text-neutral-400 pt-2">
            Hisoblash formulasi: oylik = ((narx − boshlang'ich) × (1 + stavka%)) ÷ oylar soni.
            Oylik limit rejimi: boshlang'ich = narx − (oylik × oylar) ÷ (1 + stavka%).
            Yillik limit rejimi: boshlang'ich = max(0, narx − (yillik limit − ishlatilgan)).
          </footer>
        </div>
      </div>
    </div>
  );
}

function LabeledInput({ label, value, onChange, placeholder, readOnly }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-neutral-600">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        className="rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-neutral-300 disabled:bg-neutral-100"
        placeholder={placeholder}
        value={formatInputNumber(value)}
        onChange={(e) => onChange(e.target.value)}
        readOnly={!!readOnly}
        disabled={!!readOnly}
      />
    </div>
  );
}

function StatRow({ label, value, big }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-sm text-neutral-600">{label}</span>
      <span className={`${big ? "text-2xl font-semibold" : "text-base font-medium"}`}>
        {value}
      </span>
    </div>
  );
}

function RatesEditor({ rates, setRates }) {
  const [local, setLocal] = useState(rates);

  const onCell = (m, v) => {
    const num = Number(String(v).replace(/[^0-9.]/g, ""));
    setLocal((s) => ({ ...s, [m]: isNaN(num) ? s[m] : num }));
  };

  const apply = () => setRates(local);
  const reset = () => setLocal(DEFAULT_RATES);

  return (
    <div className="border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Stavkalarni tahrirlash (%)</h3>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50" onClick={reset}>
            Standartni qaytarish
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white" onClick={apply}>
            Saqlash
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
        {Array.from({ length: 15 }, (_, i) => i + 1).map((m) => (
          <div key={m} className="border rounded-xl p-2 text-center">
            <div className="text-xs text-neutral-500">{m} oy</div>
            <input
              className="w-full text-center outline-none mt-1"
              value={local[m]}
              onChange={(e) => onCell(m, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// === Small utils ===
function sanitizeInt(raw) {
  // keep digits only, return number
  const only = String(raw).replace(/[^0-9]/g, "");
  return Number(only || 0);
}

function formatInputNumber(n) {
  const s = String(n ?? "").replace(/[^0-9]/g, "");
  if (!s) return "";
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// === Dev sanity tests (run only in dev) ===
function approxEqual(a, b, tol = 1) {
  return Math.abs(a - b) <= tol;
}

function runSanityTests() {
  // Test 1: Yearly limit example from chat
  const price = 17_000_000;
  const yearlyLimit = 12_000_000;
  const used = 0;
  const months = 10;
  const r = DEFAULT_RATES[10] / 100; // 55%
  const available = Math.max(0, yearlyLimit - used);
  const down = Math.max(0, price - available); // 5,000,000
  const financed = price - down; // 12,000,000
  const monthly = (financed * (1 + r)) / months; // 1,860,000
  console.assert(approxEqual(down, 5_000_000, 2), "Yearly down wrong");
  console.assert(approxEqual(financed, 12_000_000, 2), "Yearly financed wrong");
  console.assert(approxEqual(monthly, 1_860_000, 2), "Yearly monthly wrong");

  // Test 2: Monthly-limit derived down
  const price2 = 12_500_000;
  const months2 = 12;
  const r2 = DEFAULT_RATES[12] / 100; // 63%
  const monthlyLimit2 = 1_000_000;
  const down2 = price2 - (monthlyLimit2 * months2) / (1 + r2);
  const financed2 = price2 - down2;
  const monthly2 = (financed2 * (1 + r2)) / months2;
  console.assert(approxEqual(monthly2, monthlyLimit2, 2), "Monthly-limit consistency");

  // Test 3: Plain down payment
  const price3 = 10_000_000;
  const down3 = 3_000_000;
  const months3 = 5;
  const r3 = DEFAULT_RATES[5] / 100; // 35%
  const monthly3 = ((price3 - down3) * (1 + r3)) / months3;
  console.assert(monthly3 > 0, "Plain down monthly should be positive");

  // Test 4: Clamp and formatting sanity
  console.assert(clamp(5, 0, 10) === 5, "Clamp mid");
  console.assert(clamp(-1, 0, 10) === 0, "Clamp low");
  console.assert(clamp(99, 0, 10) === 10, "Clamp high");
  console.assert(fmt(1234567) === new Intl.NumberFormat("uz-UZ").format(1234567), "fmt format");
}

// In dev builds, run sanity tests without referencing bare `import` identifier
try {
  if (import.meta && import.meta.env && import.meta.env.DEV) {
    runSanityTests();
  }
} catch (e) {
  // ignore if import.meta is not available in the environment
}
