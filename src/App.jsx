import { useEffect, useState } from "react";

/* STORAGE KEYS */
const K_TODAY = "app_v2_today";
const K_HISTORY = "app_v2_history";
const K_SETTINGS = "app_v2_settings";

/* DEFAULT SETTINGS */
const DEFAULT_SETTINGS = {
  name: "Çocuk",
  limit: 120,
  step: 5,
};

/* SEVİYE ORANLARI */
const LEVELS = {
  efsane: { ratio: 0.65, emoji: "🤩", color: "from-purple-600 to-indigo-700" },
  iyi: { ratio: 0.85, emoji: "🙂", color: "from-green-500 to-emerald-600" },
  sinirda: { ratio: 1.0, emoji: "😐", color: "from-yellow-500 to-orange-500" },
  asti: { ratio: 999, emoji: "😵", color: "from-red-500 to-rose-600" },
};

export default function App() {
  const [tab, setTab] = useState("BUGÜN");

  const [sabah, setSabah] = useState(0);
  const [ogle, setOgle] = useState(0);
  const [aksam, setAksam] = useState(0);

  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const total = sabah + ogle + aksam;

  /* LOAD */
  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem(K_HISTORY)) || []);
    setSettings(JSON.parse(localStorage.getItem(K_SETTINGS)) || DEFAULT_SETTINGS);

    const today = JSON.parse(localStorage.getItem(K_TODAY)) || {};
    setSabah(today.sabah || 0);
    setOgle(today.ogle || 0);
    setAksam(today.aksam || 0);
  }, []);

  /* SAVE */
  useEffect(() => {
    localStorage.setItem(K_HISTORY, JSON.stringify(history));
    localStorage.setItem(K_SETTINGS, JSON.stringify(settings));
    localStorage.setItem(K_TODAY, JSON.stringify({ sabah, ogle, aksam }));
  }, [history, settings, sabah, ogle, aksam]);

  /* SEVİYE HESABI (ORANLI) */
  function getLevel(totalValue) {
    const limit = settings.limit;

    if (totalValue <= limit * LEVELS.efsane.ratio)
      return { key: "efsane", name: "Efsane", ...LEVELS.efsane };
    if (totalValue <= limit * LEVELS.iyi.ratio)
      return { key: "iyi", name: "İyi", ...LEVELS.iyi };
    if (totalValue <= limit * LEVELS.sinirda.ratio)
      return { key: "sinirda", name: "Sınırda", ...LEVELS.sinirda };
    return { key: "asti", name: "Aştı", ...LEVELS.asti };
  }

  const level = getLevel(total);

  /* YILDIZ / TAÇ – GEÇMİŞTEN HESAP */
  const efsaneCount = history.filter(h => h.key === "efsane").length;
  const crown = Math.floor(efsaneCount / 7);
  const star = efsaneCount % 7;

  /* GÜNÜ TAMAMLA */
  function completeDay() {
    const l = getLevel(total);

    const record = {
      id: Date.now(),
      date: new Date().toLocaleDateString("tr-TR"),
      total,
      key: l.key,
      emoji: l.emoji,
    };

    setHistory(prev => [record, ...prev]);

    setSabah(0);
    setOgle(0);
    setAksam(0);
  }

  /* GEÇMİŞTEN SİL */
  function deleteRecord(id) {
    if (!confirm("Bu kaydı silmek istiyor musun?")) return;
    setHistory(prev => prev.filter(h => h.id !== id));
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${level.color} p-4`}>
      <div className="bg-white rounded-xl shadow max-w-md mx-auto p-4 space-y-4">

        {/* HEADER */}
        <div className="text-center">
          <h1 className="font-bold">{settings.name}</h1>
          <div className="text-3xl">{level.emoji}</div>
          <div>{level.name}</div>
          <div className="text-sm">⭐ {star} · 👑 {crown}</div>
        </div>

        {/* TABS */}
        <div className="grid grid-cols-4 gap-1">
          {["BUGÜN", "GEÇMİŞ", "ANALİZ", "AYAR"].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={tab === t ? "bg-indigo-600 text-white p-2" : "bg-gray-200 p-2"}
            >
              {t}
            </button>
          ))}
        </div>

        {/* BUGÜN */}
        {tab === "BUGÜN" && (
          <>
            <div className="text-center">{total} / {settings.limit} dk</div>
            <Counter label="Sabah" v={sabah} set={setSabah} step={settings.step} />
            <Counter label="Öğle" v={ogle} set={setOgle} step={settings.step} />
            <Counter label="Akşam" v={aksam} set={setAksam} step={settings.step} />
            <button onClick={completeDay} className="w-full bg-indigo-600 text-white p-2">
              GÜNÜ TAMAMLA
            </button>
          </>
        )}

        {/* GEÇMİŞ */}
        {tab === "GEÇMİŞ" && (
          history.length === 0
            ? <p className="text-center text-gray-400">Kayıt yok</p>
            : history.map(h => (
              <div key={h.id} className="flex justify-between bg-gray-100 p-2">
                <span>{h.date} · {h.emoji} {h.total}</span>
                <button onClick={() => deleteRecord(h.id)}>🗑️</button>
              </div>
            ))
        )}

        {/* ANALİZ */}
        {tab === "ANALİZ" && (
          <div className="text-sm space-y-2">
            <div>Toplam gün: <b>{history.length}</b></div>
            <div>Efsane gün: <b>{efsaneCount}</b></div>
            <div>Yıldız: <b>{star}</b></div>
            <div>Taç: <b>{crown}</b></div>
          </div>
        )}

        {/* AYAR */}
        {tab === "AYAR" && (
          <div className="space-y-2 text-sm">
            <label>Çocuk Adı</label>
            <input
              className="border p-2 w-full"
              value={settings.name}
              onChange={e => setSettings({ ...settings, name: e.target.value })}
            />

            <label>Günlük Limit</label>
            <input
              type="number"
              className="border p-2 w-full"
              value={settings.limit}
              onChange={e => setSettings({ ...settings, limit: +e.target.value })}
            />
          </div>
        )}

      </div>
    </div>
  );
}

function Counter({ label, v, set, step }) {
  return (
    <div className="flex justify-between bg-gray-100 p-2">
      <span>{label}</span>
      <div>
        <button onClick={() => set(Math.max(0, v - step))}>−</button>
        <span className="mx-2">{v}</span>
        <button onClick={() => set(v + step)}>+</button>
      </div>
    </div>
  );
}
