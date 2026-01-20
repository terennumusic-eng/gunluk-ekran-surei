import { useEffect, useState } from "react";

/* STORAGE KEYS */
const K_TODAY = "app_v2_today";
const K_HISTORY = "app_v2_history";
const K_SETTINGS = "app_v2_settings";
const K_REWARD = "app_v2_rewards";

/* DEFAULT SETTINGS */
const DEFAULT_SETTINGS = {
  name: "Emre Alp",
  limit: 120,
  step: 5,
  pin: "1234",
  levels: {
    efsane: { max: 90, emoji: "🤩" },
    normal: { max: 120, emoji: "🙂" },
    uzgun: { max: 180, emoji: "😞" },
    asiri: { max: 9999, emoji: "😵" },
  },
};

export default function App() {
  /* TAB */
  const [tab, setTab] = useState("BUGÜN");

  /* TODAY */
  const [sabah, setSabah] = useState(0);
  const [ogle, setOgle] = useState(0);
  const [aksam, setAksam] = useState(0);

  /* DATA */
  const [history, setHistory] = useState([]);

  /* SETTINGS */
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [pinOK, setPinOK] = useState(false);
  const [pinInput, setPinInput] = useState("");

  /* REWARD */
  const [star, setStar] = useState(0);
  const [crown, setCrown] = useState(0);

  const total = sabah + ogle + aksam;

  /* LOAD */
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

  /* SAVE */
  useEffect(() => {
    localStorage.setItem(K_TODAY, JSON.stringify({ sabah, ogle, aksam }));
  }, [sabah, ogle, aksam]);

  useEffect(() => {
    localStorage.setItem(K_HISTORY, JSON.stringify(history));
    localStorage.setItem(K_SETTINGS, JSON.stringify(settings));
    localStorage.setItem(K_REWARD, JSON.stringify({ star, crown }));
  }, [history, settings, star, crown]);

  /* LEVEL */
  function getLevel() {
    const l = settings.levels;
    if (total <= l.efsane.max) return { key: "efsane", name: "Efsane", emoji: l.efsane.emoji };
    if (total <= l.normal.max) return { key: "normal", name: "Normal", emoji: l.normal.emoji };
    if (total <= l.uzgun.max) return { key: "uzgun", name: "Üzgün", emoji: l.uzgun.emoji };
    return { key: "asiri", name: "Aşırı", emoji: l.asiri.emoji };
  }

  const level = getLevel();

  /* COMPLETE DAY */
  function completeDay() {
    const record = {
      date: new Date().toLocaleDateString("tr-TR"),
      total,
      level: level.name,
      emoji: level.emoji,
    };

    setHistory(prev => [record, ...prev]);

    if (level.key === "efsane") {
      setStar(prev => {
        if (prev + 1 >= 7) {
          setCrown(c => c + 1);
          return 0;
        }
        return prev + 1;
      });
    }

    setSabah(0);
    setOgle(0);
    setAksam(0);
  }

  /* ANALYSIS */
  const avg =
    history.length === 0
      ? 0
      : Math.round(history.reduce((s, g) => s + g.total, 0) / history.length);

  const efsaneCount = history.filter(h => h.level === "Efsane").length;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow p-4 space-y-4">

        {/* HEADER */}
        <div className="text-center">
          <h1 className="text-xl font-bold">{settings.name}</h1>
          <div className="text-3xl">{level.emoji}</div>
          <div className="text-sm">{level.name}</div>
          <div className="text-yellow-500 text-sm">⭐ {star}/7 · 👑 {crown}</div>
        </div>

        {/* TABS */}
        <div className="grid grid-cols-4 gap-1">
          {["BUGÜN", "GEÇMİŞ", "ANALİZ", "AYAR"].map(t => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setPinOK(false);
              }}
              className={`p-2 rounded ${tab === t ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* TODAY */}
        {tab === "BUGÜN" && (
          <>
            <div className="bg-blue-50 p-2 rounded text-center">
              {total} / {settings.limit} dk
            </div>

            <Counter label="Sabah" v={sabah} set={setSabah} step={settings.step} />
            <Counter label="Öğle" v={ogle} set={setOgle} step={settings.step} />
            <Counter label="Akşam" v={aksam} set={setAksam} step={settings.step} />

            <button onClick={completeDay} className="w-full bg-green-600 text-white p-2 rounded">
              GÜNÜ TAMAMLA
            </button>
          </>
        )}

        {/* HISTORY */}
        {tab === "GEÇMİŞ" && (
          <div className="space-y-2 text-sm">
            {history.length === 0 && <p className="text-center text-gray-500">Kayıt yok</p>}
            {history.map((h, i) => (
              <div key={i} className="bg-gray-50 p-2 rounded flex justify-between">
                <span>{h.date}</span>
                <span>{h.emoji} {h.total} dk</span>
              </div>
            ))}
          </div>
        )}

        {/* ANALYSIS */}
        {tab === "ANALİZ" && (
          <div className="text-sm space-y-2">
            <div>Toplam gün: <b>{history.length}</b></div>
            <div>Günlük ortalama: <b>{avg} dk</b></div>
            <div>Efsane gün: <b>{efsaneCount}</b></div>
            <div>Hedef: <b>7 ⭐ = 👑</b></div>
          </div>
        )}

        {/* SETTINGS */}
        {tab === "AYAR" && (
          !pinOK ? (
            <>
              <input
                type="password"
                placeholder="PIN"
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                className="border p-2 w-full"
              />
              <button
                onClick={() => pinInput === settings.pin ? setPinOK(true) : alert("Yanlış PIN")}
                className="w-full bg-blue-600 text-white p-2 rounded"
              >
                GİRİŞ
              </button>
            </>
          ) : (
            <div className="space-y-2 text-sm">
              <label>Çocuk adı</label>
              <input
                value={settings.name}
                onChange={e => setSettings({ ...settings, name: e.target.value })}
                className="border p-2 w-full"
              />

              <label>Günlük limit (dk)</label>
              <input
                type="number"
                value={settings.limit}
                onChange={e => setSettings({ ...settings, limit: +e.target.value })}
                className="border p-2 w-full"
              />

              <label>Artış adımı</label>
              <select
                value={settings.step}
                onChange={e => setSettings({ ...settings, step: +e.target.value })}
                className="border p-2 w-full"
              >
                <option value={5}>+5 dk</option>
                <option value={10}>+10 dk</option>
                <option value={15}>+15 dk</option>
              </select>

              <label>Yeni PIN</label>
              <input
                type="password"
                onChange={e => setSettings({ ...settings, pin: e.target.value })}
                className="border p-2 w-full"
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}

function Counter({ label, v, set, step }) {
  return (
    <div className="flex justify-between bg-gray-50 p-2 rounded">
      <span>{label}</span>
      <div className="flex gap-2">
        <button onClick={() => set(Math.max(0, v - step))}>−</button>
        <span>{v}</span>
        <button onClick={() => set(v + step)}>+</button>
      </div>
    </div>
  );
}
