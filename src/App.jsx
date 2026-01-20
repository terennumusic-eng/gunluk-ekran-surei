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

/* LEVELS (ORANLI) */
const LEVELS = {
  efsane: { ratio: 0.65, emoji: "🤩", label: "Efsane", bg: "bg-purple-100", bar: "bg-purple-600" },
  iyi: { ratio: 0.85, emoji: "🙂", label: "İyi", bg: "bg-green-100", bar: "bg-green-500" },
  sinirda: { ratio: 1.0, emoji: "😐", label: "Sınırda", bg: "bg-yellow-100", bar: "bg-yellow-400" },
  asti: { ratio: 999, emoji: "😵", label: "Aşırı", bg: "bg-red-100", bar: "bg-red-500" },
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

  /* LEVEL */
  function getLevel(totalValue) {
    const limit = settings.limit;
    if (totalValue <= limit * LEVELS.efsane.ratio) return { key: "efsane", ...LEVELS.efsane };
    if (totalValue <= limit * LEVELS.iyi.ratio) return { key: "iyi", ...LEVELS.iyi };
    if (totalValue <= limit * LEVELS.sinirda.ratio) return { key: "sinirda", ...LEVELS.sinirda };
    return { key: "asti", ...LEVELS.asti };
  }

  const level = getLevel(total);

  /* REWARDS (GEÇMİŞTEN) */
  const efsaneCount = history.filter(h => h.key === "efsane").length;
  const crown = Math.floor(efsaneCount / 7);
  const star = efsaneCount % 7;
  const kalan = 7 - star;

  /* COMPLETE DAY */
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

  function deleteRecord(id) {
    if (!confirm("Bu kayıt silinsin mi?")) return;
    setHistory(prev => prev.filter(h => h.id !== id));
  }

  /* ANALYSIS DATA */
  const last7 = history.slice(0, 7).reverse();
  const maxVal = Math.max(...last7.map(d => d.total), settings.limit);

  const counts = {
    efsane: history.filter(h => h.key === "efsane").length,
    iyi: history.filter(h => h.key === "iyi").length,
    sinirda: history.filter(h => h.key === "sinirda").length,
    asti: history.filter(h => h.key === "asti").length,
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-xl shadow max-w-md mx-auto p-4 space-y-4">

        {/* HEADER */}
        <div className="text-center">
          <h1 className="font-bold">{settings.name}</h1>
          <div className="text-3xl">{level.emoji}</div>
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
        {tab === "GEÇMİŞ" && history.map(h => (
          <div key={h.id} className="flex justify-between bg-gray-100 p-2">
            <span>{h.date} · {h.emoji} {h.total}</span>
            <button onClick={() => deleteRecord(h.id)}>🗑️</button>
          </div>
        ))}

        {/* ANALİZ */}
        {tab === "ANALİZ" && (
          history.length === 0 ? (
            <p className="text-center text-gray-400">Analiz için gün ekleyin</p>
          ) : (
            <>
              {/* SUMMARY CARDS */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.keys(LEVELS).map(k => (
                  <div key={k} className={`${LEVELS[k].bg} p-2 rounded text-center`}>
                    <div className="font-bold">{LEVELS[k].label}</div>
                    <div>{counts[k]} gün</div>
                  </div>
                ))}
              </div>

              {/* BAR GRAPH */}
              <div className="flex items-end gap-1 h-40">
                {last7.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className={`${LEVELS[d.key].bar} w-full rounded`}
                      style={{ height: `${(d.total / maxVal) * 100}%` }}
                    />
                    <span className="text-xs mt-1">{d.total}</span>
                  </div>
                ))}
              </div>

              {/* GOAL INFO */}
              <div className="text-center text-sm">
                Bu hafta <b>{last7.filter(d => d.key === "efsane").length}</b> efsane gün<br />
                1 taç için <b>{kalan}</b> efsane gün kaldı
              </div>
            </>
          )
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
