import { useEffect, useState } from "react";

/* STORAGE KEYS */
const K_TODAY = "app_v3_today";
const K_HISTORY = "app_v3_history";
const K_SETTINGS = "app_v3_settings";
const K_REWARD = "app_v3_rewards";

/* DEFAULT SETTINGS */
const DEFAULT_SETTINGS = {
  name: "Emre Alp",
  limit: 120,
  step: 5,
  pin: "1234",
  weeklyStarTarget: 5,
  levels: {
    efsane: { max: 80, emoji: "👑", color: "from-purple-600 to-indigo-700" },
    iyi: { max: 100, emoji: "😊", color: "from-green-500 to-emerald-600" },
    sinirda: { max: 120, emoji: "😐", color: "from-yellow-500 to-orange-500" },
    asti: { max: 9999, emoji: "😟", color: "from-red-500 to-rose-600" },
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

  const total = sabah + ogle + aksam;

  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem(K_HISTORY)) || []);
    setSettings(JSON.parse(localStorage.getItem(K_SETTINGS)) || DEFAULT_SETTINGS);

    const today = JSON.parse(localStorage.getItem(K_TODAY)) || {};
    setSabah(today.sabah || 0);
    setOgle(today.ogle || 0);
    setAksam(today.aksam || 0);

    const r = JSON.parse(localStorage.getItem(K_REWARD)) || {};
    setStar(r.star || 0);
    setCrown(r.crown || 0);
  }, []);

  useEffect(() => {
    localStorage.setItem(K_TODAY, JSON.stringify({ sabah, ogle, aksam }));
    localStorage.setItem(K_HISTORY, JSON.stringify(history));
    localStorage.setItem(K_SETTINGS, JSON.stringify(settings));
    localStorage.setItem(K_REWARD, JSON.stringify({ star, crown }));
  }, [sabah, ogle, aksam, history, settings, star, crown]);

  function getLevel() {
    const l = settings.levels;
    if (total <= l.efsane.max) return { key: "efsane", ...l.efsane, name: "Efsane" };
    if (total <= l.iyi.max) return { key: "iyi", ...l.iyi, name: "İyi" };
    if (total <= l.sinirda.max) return { key: "sinirda", ...l.sinirda, name: "Sınırda" };
    return { key: "asti", ...l.asti, name: "Aştı" };
  }

  const level = getLevel();

  function completeDay() {
    const record = {
      date: new Date().toLocaleDateString("tr-TR"),
      total,
      level: level.name,
      emoji: level.emoji,
    };

    setHistory((p) => [record, ...p]);

    if (level.key === "efsane") {
      setStar((s) => {
        if (s + 1 >= settings.weeklyStarTarget) {
          setCrown((c) => c + 1);
          return 0;
        }
        return s + 1;
      });
    }

    setSabah(0);
    setOgle(0);
    setAksam(0);
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${level.color} p-4`}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md mx-auto p-4 space-y-4">

        <div className="text-center">
          <h1 className="text-xl font-bold">{settings.name}</h1>
          <div className="text-4xl">{level.emoji}</div>
          <div className="font-semibold">{level.name}</div>
          <div className="text-sm text-yellow-500">
            ⭐ {star}/{settings.weeklyStarTarget} · 👑 {crown}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1">
          {["BUGÜN", "GEÇMİŞ", "ANALİZ", "AYAR"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`p-2 rounded-xl text-sm ${
                tab === t ? "bg-indigo-600 text-white" : "bg-gray-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "BUGÜN" && (
          <>
            <div className="bg-indigo-50 p-2 rounded text-center font-semibold">
              {total} / {settings.limit} dk
            </div>

            <Counter label="Sabah" v={sabah} set={setSabah} step={settings.step} />
            <Counter label="Öğle / İkindi" v={ogle} set={setOgle} step={settings.step} />
            <Counter label="Akşam" v={aksam} set={setAksam} step={settings.step} />

            <button
              onClick={completeDay}
              className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold"
            >
              GÜNÜ BİTİR
            </button>
          </>
        )}

        {tab === "GEÇMİŞ" && (
          <div className="space-y-2 text-sm">
            {history.length === 0 && <p className="text-center text-gray-400">Kayıt yok</p>}
            {history.map((h, i) => (
              <div key={i} className="flex justify-between bg-gray-100 p-2 rounded">
                <span>{h.date}</span>
                <span>{h.emoji} {h.total} dk</span>
              </div>
            ))}
          </div>
        )}

        {tab === "ANALİZ" && (
          <div className="text-sm space-y-2">
            <div>Toplam gün: <b>{history.length}</b></div>
            <div>
              Efsane gün: <b>{history.filter(h => h.level === "Efsane").length}</b>
            </div>
            <div>Haftalık hedef: <b>{settings.weeklyStarTarget} ⭐</b></div>
          </div>
        )}

        {tab === "AYAR" && (
          <div className="text-sm space-y-2">
            <label>Çocuk Adı</label>
            <input
              className="border p-2 w-full rounded"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
            />

            <label>Günlük Limit</label>
            <input
              type="number"
              className="border p-2 w-full rounded"
              value={settings.limit}
              onChange={(e) => setSettings({ ...settings, limit: +e.target.value })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Counter({ label, v, set, step }) {
  return (
    <div className="flex justify-between items-center bg-gray-100 p-2 rounded-xl">
      <span>{label}</span>
      <div className="flex items-center gap-2">
        <button onClick={() => set(Math.max(0, v - step))}>−</button>
        <span className="w-6 text-center">{v}</span>
        <button onClick={() => set(v + step)}>+</button>
      </div>
    </div>
  );
}
