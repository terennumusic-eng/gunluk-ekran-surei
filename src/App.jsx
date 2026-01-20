import { useEffect, useRef, useState } from "react";

/* STORAGE KEYS */
const K_TODAY = "app_v2_today";
const K_HISTORY = "app_v2_history";
const K_SETTINGS = "app_v2_settings";
const K_REWARD = "app_v2_rewards";

/* DEFAULT SETTINGS */
const DEFAULT_SETTINGS = {
  name: "Çocuk",
  limit: 120,
  step: 5,
  weeklyStarTarget: 7,
  levels: {
    efsane: { ratio: 0.65, emoji: "🤩", color: "from-purple-600 to-indigo-700" },
    iyi: { ratio: 0.85, emoji: "🙂", color: "from-green-500 to-emerald-600" },
    sinirda: { ratio: 1.0, emoji: "😐", color: "from-yellow-500 to-orange-500" },
    asti: { ratio: 999, emoji: "😵", color: "from-red-500 to-rose-600" },
  },
};

export default function App() {
  const [tab, setTab] = useState("BUGÜN");

  const [sabah, setSabah] = useState(0);
  const [ogle, setOgle] = useState(0);
  const [aksam, setAksam] = useState(0);

  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const [star, setStar] = useState(0);
  const [crown, setCrown] = useState(0);

  const [deletedItem, setDeletedItem] = useState(null);
  const undoTimer = useRef(null);

  const total = sabah + ogle + aksam;

  /* LOAD */
  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem(K_HISTORY)) || []);
    setSettings(JSON.parse(localStorage.getItem(K_SETTINGS)) || DEFAULT_SETTINGS);
    const r = JSON.parse(localStorage.getItem(K_REWARD)) || {};
    setStar(r.star || 0);
    setCrown(r.crown || 0);
  }, []);

  /* SAVE */
  useEffect(() => {
    localStorage.setItem(K_HISTORY, JSON.stringify(history));
    localStorage.setItem(K_SETTINGS, JSON.stringify(settings));
    localStorage.setItem(K_REWARD, JSON.stringify({ star, crown }));
    localStorage.setItem(K_TODAY, JSON.stringify({ sabah, ogle, aksam }));
  }, [history, settings, star, crown, sabah, ogle, aksam]);

  /* LEVEL (LIMIT-AWARE) */
  function getLevel(totalValue = total) {
    const l = settings.levels;
    const limit = settings.limit;

    if (totalValue <= limit * l.efsane.ratio)
      return { key: "efsane", name: "Efsane", ...l.efsane };
    if (totalValue <= limit * l.iyi.ratio)
      return { key: "iyi", name: "İyi", ...l.iyi };
    if (totalValue <= limit * l.sinirda.ratio)
      return { key: "sinirda", name: "Sınırda", ...l.sinirda };
    return { key: "asti", name: "Aştı", ...l.asti };
  }

  const level = getLevel();

  /* COMPLETE DAY */
  function completeDay() {
    const recordLevel = getLevel(total);

    const record = {
      id: Date.now(),
      date: new Date().toLocaleDateString("tr-TR"),
      total,
      level: recordLevel.name,
      key: recordLevel.key,
      emoji: recordLevel.emoji,
    };

    setHistory(p => [record, ...p]);

    if (record.key === "efsane") {
      setStar(s => {
        if (s + 1 >= settings.weeklyStarTarget) {
          setCrown(c => c + 1);
          return 0;
        }
        return s + 1;
      });
    }

    setSabah(0);
    setOgle(0);
    setAksam(0);
  }

  /* DELETE WITH STAR/TAÇ FIX */
  function deleteRecord(item) {
    setHistory(prev => prev.filter(h => h.id !== item.id));
    setDeletedItem(item);

    if (item.key === "efsane") {
      setStar(s => {
        if (s > 0) return s - 1;
        if (crown > 0) {
          setCrown(c => c - 1);
          return settings.weeklyStarTarget - 1;
        }
        return 0;
      });
    }

    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setDeletedItem(null), 10000);
  }

  function undoDelete() {
    if (!deletedItem) return;
    setHistory(prev => [deletedItem, ...prev]);

    if (deletedItem.key === "efsane") {
      setStar(s => {
        if (s + 1 >= settings.weeklyStarTarget) {
          setCrown(c => c + 1);
          return 0;
        }
        return s + 1;
      });
    }

    setDeletedItem(null);
    clearTimeout(undoTimer.current);
  }

  /* UI */
  return (
    <div className={`min-h-screen bg-gradient-to-br ${level.color} p-4`}>
      <div className="bg-white rounded-xl shadow max-w-md mx-auto p-4 space-y-4">

        <div className="text-center">
          <h1 className="font-bold">{settings.name}</h1>
          <div className="text-3xl">{level.emoji}</div>
          <div>{level.name}</div>
          <div className="text-sm">⭐ {star} / 👑 {crown}</div>
        </div>

        <div className="grid grid-cols-4 gap-1">
          {["BUGÜN", "GEÇMİŞ", "ANALİZ", "AYAR"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={tab === t ? "bg-indigo-600 text-white p-2" : "bg-gray-200 p-2"}>
              {t}
            </button>
          ))}
        </div>

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

        {tab === "GEÇMİŞ" && history.map(h => (
          <div key={h.id} className="flex justify-between bg-gray-100 p-2">
            <span>{h.date} · {h.emoji} {h.total}</span>
            <button onClick={() => deleteRecord(h)}>🗑️</button>
          </div>
        ))}

        {deletedItem && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded">
            Kayıt silindi <button onClick={undoDelete} className="underline">GERİ AL</button>
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
