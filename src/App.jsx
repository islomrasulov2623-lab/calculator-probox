import React, { useMemo, useState } from "react";

// === Helper: format currency in so'm ===
const fmt = (n) =>
  isNaN(n)
    ? "—"
    : new Intl.NumberFormat("uz-UZ").format(Math.round(Number(n)));

// Default month -> markup % table (B2C)
const DEFAULT_RATES = {
  1: 5.5,
  2: 11,
  3: 17,
  4: 25,
  5: 33,
  6: 39,
  7: 45,
  8: 49,
  9: 52,
  10: 58,
  11: 61,
  12: 67,
  13: 71,
  14: 76,
  15: 81,
};

export default function SomInstallmentCalculator() {
  const [price, setPrice] = useState(0); // so'm
  const [down, setDown] = useState(0); // so'm (manual)
  const [months, setMonths] = useState(0); // oy
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [editing, setEditing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Rejimlar
  const [limitMode, setLimitMode] = useState(false); // NEW: Scoring limiti bo'yicha (oylik emas!)
  const [scoringLimit, setScoringLimit] = useState(16_000_000); // scoring chiqaradigan limit (jami bo'lib-bo'lib to'lanadigan summa limiti)

  const [yearlyMode, setYearlyMode] = useState(false); // yillik limit rejimi (principalga nisbatan)
  const [yearlyLimit, setYearlyLimit] = useState(12_000_000);
  const [usedThisYear, setUsedThisYear] = useState(0);

  // Derived values (common)
  const ratePct = months ? (rates[months] ?? 0) : 0;
  const repayFull = Number(price) * (1 + ratePct / 100); // tan narx + ustama (agar boshlang'ich 0 bo'lsa)

  // Yillik limit (principal) rejimi uchun yordamchi: mavjud limit
  const available = Math.max(0, Number(yearlyLimit) - Number(usedThisYear));
  const requiredDownYearly = Math.max(0, Number(price) - available);

  // === Boshlang'ichni tanlash mantiqi ===
  let appliedDown = Number(down); // default: manual
  let displayMonthly;             // UI'da ko'rsatiladigan oylik
  let financed, fee, repayTotal;  // non-limit yoki yearly rejim uchun
  let detailsBlock;               // "Tafsilotlar" rejimga qarab
  let grandTotal;                 // umumiy (boshlang'ich + bo'lib-bo'lib jami)

  if (limitMode && months) {
    // --- Scoring limiti bo'yicha: foydalanuvchi bergan talablarga muvofiq ---
    // 1) To'liq hisob (tan narx + ustama) = repayFull
    // 2) Kerakli boshlang'ich = max(0, repayFull − scoringLimit)
    // 3) Bo'lib-bo'lib jami = min(repayFull, scoringLimit)
    // 4) Oylik = (bo'lib-bo'lib jami) / oylar
    const limit = Number(scoringLimit);
    const diff = Math.max(0, repayFull - limit);
    appliedDown = diff; // talab: 21.7M − 16M = 5.7M
    const financedRepay = Math.min(repayFull, limit);
    displayMonthly = months ? financedRepay / months : 0;
    grandTotal = appliedDown + financedRepay; // odatda = repayFull

    detailsBlock = (
      <div className="grid grid-cols-1 gap-3">
        <div className="h-px bg-neutral-200" />
        <StatRow label="To'liq hisob (tan narx + ustama)" value={`${fmt(repayFull)} so'm`} />
        <StatRow label="Scoring limiti" value={`${fmt(limit)} so'm`} />
        <StatRow label="Kerakli boshlang'ich" value={`${fmt(appliedDown)} so'm`} />
        <StatRow label="Bo'lib-bo'lib jami" value={`${fmt(financedRepay)} so'm`} />
      </div>
    );
  } else {
    // --- Oddiy yoki Yillik limit (principal) rejimi ---
    const usedDown = yearlyMode ? clamp(requiredDownYearly, 0, Number(price)) : Number(down);
    financed = Math.max(0, Number(price) - usedDown);
    fee = (financed * ratePct) / 100;
    repayTotal = financed + fee;
    displayMonthly = months ? repayTotal / months : 0;
    grandTotal = repayTotal + usedDown;

    detailsBlock = (
      <div className="grid grid-cols-1 gap-3">
        <div className="h-px bg-neutral-200" />
        <StatRow label="Moliyalashtiriladigan summa" value={`${fmt(financed)} so'm`} />
        <StatRow label={`Ustama (${ratePct}%)`} value={`${fmt(fee)} so'm`} />
        <StatRow label="Bo'lib-bo'lib jami" value={`${fmt(repayTotal)} so'm`} />
      </div>
    );

    appliedDown = usedDown;
  }

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => i + 1).map((m) => ({ value: m, label: `${m} oy` })),
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
              <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center text-white font-bold">PB</div>
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
                <span className="text-sm text-neutral-700">Yillik limit (principal) rejimi</span>
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
                <span className="text-sm text-neutral-700">Scoring limiti bo‘yicha rejim</span>
              </label>
            </div>

            {/* Price */}
            <LabeledInput
              label="Mahsulot narxi (so'm)"
              placeholder="masalan, 14 000 000"
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
                  label="Scoring limiti (so'm)"
                  placeholder="masalan, 16 000 000"
                  value={scoringLimit}
                  onChange={(v) => setScoringLimit(sanitizeInt(v))}
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
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 gap-3">
            <StatRow label="Oylik to'lov" value={`${fmt(displayMonthly || 0)} so'm`} big />
            <StatRow label="Umumiy (boshlang'ich bilan)" value={`${fmt(grandTotal || 0)} so'm`} />
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowDetails((v) => !v)}
              className="mt-2 text-sm px-3 py-1.5 rounded-lg border shadow-sm hover:bg-neutral-50"
            >
              {showDetails ? "Tafsilotlarni yashirish" : "Tafsilotlarni ko‘rsatish"}
            </button>
          </div>

          {showDetails && detailsBlock}

          {/* Warnings */}
          {appliedDown > Number(price) && (
            <p className="text-sm text-red-600">Diqqat: hisob natijasida boshlang'ich to'lov mahsulot narxidan yuqori chiqdi. Limit yetarli emas.</p>
          )}

          {/* Rates editor */}
          {editing && <RatesEditor rates={rates} setRates={setRates} />}

          <footer className="text-xs text-neutral-400 pt-2 space-y-1">
            <div>Oddiy formula: oylik = ((narx − boshlang'ich) × (1 + stavka%)) ÷ oylar.</div>
            <div>Yillik limit (principal) rejimi: boshlang'ich = max(0, narx − (yillik limit − ishlatilgan)).</div>
            <div>Scoring limiti bo‘yicha rejim: boshlang'ich = max(0, (narx × (1 + stavka%)) − scoring limiti); oylik = (min(to‘liq hisob, limiti)) ÷ oylar.</div>
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
      <span className={`${big ? "text-2xl font-semibold" : "text-base font-medium"}`}>{value}</span>
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
          <button className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50" onClick={reset}>Standartni qaytarish</button>
          <button className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white" onClick={apply}>Saqlash</button>
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

// === Dev sanity tests ===
function approxEqual(a, b, tol = 2) { return Math.abs(a - b) <= tol; }
function runSanityTests() {
  // Test 0: DEFAULT_RATES match expected decimals (5.5%, 11%, ... 81%)
  const EXPECTED = {1:5.5,2:11,3:17,4:25,5:33,6:39,7:45,8:49,9:52,10:58,11:61,12:67,13:71,14:76,15:81};
  for (let m = 1; m <= 15; m++) {
    console.assert(approxEqual(DEFAULT_RATES[m], EXPECTED[m], 1e-3), `DEFAULT_RATES[${m}] mismatch`);
  }

  // Test 1: Yearly limit example — dynamic r taken from DEFAULT_RATES[10]
  const P1 = 17_000_000, L1 = 12_000_000, U1 = 0, m1 = 10, r1 = DEFAULT_RATES[10] / 100;
  const available1 = Math.max(0, L1 - U1);
  const down1 = Math.max(0, P1 - available1); // 5,000,000 (independent of r)
  const financed1 = P1 - down1;               // 12,000,000
  const monthly1 = (financed1 * (1 + r1)) / m1;
  const expectedMonthly1 = (financed1 * (1 + r1)) / m1;
  console.assert(approxEqual(down1, 5_000_000), 'Yearly down wrong');
  console.assert(approxEqual(financed1, 12_000_000), 'Yearly financed wrong');
  console.assert(approxEqual(monthly1, expectedMonthly1, 1), 'Yearly monthly wrong');

  // Test 2: Scoring-limit mode — dynamic with DEFAULT_RATES[10]
  const P2 = 14_000_000, m2 = 10, r2 = DEFAULT_RATES[10] / 100;
  const repayFull2 = P2 * (1 + r2);
  const limit2 = 16_000_000;
  const requiredDown2 = Math.max(0, repayFull2 - limit2);
  const monthly2 = Math.min(repayFull2, limit2) / m2;
  const expectedDown2 = Math.max(0, repayFull2 - limit2);
  const expectedMonthly2 = Math.min(repayFull2, limit2) / m2;
  console.assert(approxEqual(requiredDown2, expectedDown2, 1), 'requiredDown calc');
  console.assert(approxEqual(monthly2, expectedMonthly2, 1), 'monthly by limit');

  // Test 3: Scoring-limit mode when limit >= full repay (down=0)
  const P3 = 5_000_000, m3 = 4, r3 = DEFAULT_RATES[4] / 100;
  const repayFull3 = P3 * (1 + r3);
  const limit3 = 10_000_000;
  const requiredDown3 = Math.max(0, repayFull3 - limit3);
  const monthly3 = repayFull3 / m3;
  console.assert(approxEqual(requiredDown3, 0), 'down should be 0');
  console.assert(approxEqual(monthly3, repayFull3 / m3, 1), 'monthly when limit not binding');

  // Test 4: Clamp/fmt
  console.assert(clamp(5,0,10)===5 && clamp(-1,0,10)===0 && clamp(11,0,10)===10, 'clamp');
  console.assert(fmt(1234567) === new Intl.NumberFormat('uz-UZ').format(1234567), 'fmt');
}
try { if (import.meta && import.meta.env && import.meta.env.DEV) runSanityTests(); } catch {}
