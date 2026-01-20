import { useEffect, useState } from "react";

/* === STORAGE KEYS (SABİT – ARTIK DEĞİŞMEZ) === */
const K_TODAY = "app_v2_today";
const K_HISTORY = "app_v2_history";
const K_SETTINGS = "app_v2_settings";
const K_REWARD = "app_v2_rewards";

/* === DEFAULT SETTINGS === */
const DEFAULT_SETTINGS = {
  name: "Çocuk",
  limit: 120,
  step: 5,
  pin: "1234",
  weeklyStarTarget: 7,
  levels: {
    efsane: { max: 80, emoji: "🤩", color: "from-purple-600 to-indigo-700" },
    iyi: { max: 100, emoji: "🙂", color: "from-green-500 to-emerald-600" },
    sinirda: { max: 120, emoji: "😐", color: "from-yellow-500 to-orange-500" },
    asti: { max: 9999, emoji: "😵", color: "from-red-500 to-rose-600" },
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

  const [pinOK, setPinOK] = useState(false);
  const [pinInput, setPinInput] = useState("");

  const total = sabah + ogle + aksam;

  /* === LOAD === */
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

  /* === SAVE === */
  useEffect(() => {
    localStorage.setItem(K_TODAY, JSON.stringify({ sabah, ogle, aksam }));
    localStorage.setItem(K_HISTORY, JSON.stringify(history));
    localStorage.setItem(K_SETTINGS, JSON.stringify(settings));
    localStorage.setItem(K_REWARD, JSON.stringify({ star, crown }));
  }, [sabah, ogle, aksam, history, settings, star, crown]);

  /* === LEVEL === */
  function getLevel() {
    const l = settings.levels;
    if (total <= l.efsane.max) return { key: "efsane", name: "Efsane", ...l.efsane };
    if (total <= l.iyi.max) return { key: "iyi", name: "İyi", ...l.iyi };
    if (total <= l.sinirda.max) return { key: "sinirda", name: "Sınırda", ...l.sinirda };
    return { key: "asti", name: "Aştı", ...l.asti };
  }

  const level = getLevel();

  /* === COMPLETE DAY === */
  function completeDay() {
    const record = {
      date: new Date().toLocaleDateString("tr-TR"),
      total,
      level: level.name,
      emoji: level.emoji,
    };

    setHistory(p => [record, ...p]);

    if (level.key === "efsane") {
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

  return (
    <div className={`min-h-screen bg-gradient-to-br ${level.color} p-4`}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md mx-auto p-4 space-y-4">

        {/* HEADER */}
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold">{settings.name}</h1>
          <div className="text-3xl">{level.emoji}</div>
          <div className="font-medium">{level.name}</div>

          {/* STAR BAR */}
          <div className="flex justify-center gap-1 mt-1">
            {Array.from({ length: settings.weeklyStarTarget }).map((_, i) => (
              <span key={i} className={i < star ? "text-yellow-400" : "text-gray-300"}>
                ⭐
              </span>
            ))}
          </div>
          <div className="text-xs text-gray-500">
            {star}/{settings.weeklyStarTarget} · 👑 {crown}
          </div>
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
              className={`p-2 rounded ${
                tab === t ? "bg-indigo-600 text-white" : "bg-gray-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* BUGÜN */}
        {tab === "BUGÜN" && (
          <>
            <div className="bg-indigo-50 p-2 rounded text-center">
              {total} / {settings.limit} dk
            </div>

            <Counter label="Sabah" v={sabah} set={setSabah} step={settings.step} />
            <Counter label="Öğle" v={ogle} set={setOgle} step={settings.step} />
            <Counter label="Akşam" v={aksam} set={setAksam} step={settings.step} />

            <button
              onClick={completeDay}
              className="w-full bg-indigo-600 text-white p-2 rounded"
            >
              GÜNÜ TAMAMLA
            </button>
          </>
        )}

        {/* GEÇMİŞ */}
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

        {/* ANALİZ */}
        {tab === "ANALİZ" && (
          history.length === 0 ? (
            <p className="text-center text-gray-400">Henüz analiz için veri yok</p>
          ) : (
            <AnalysisPanel history={history} settings={settings} star={star} />
          )
        )}

        {/* AYAR */}
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
                onClick={() =>
                  pinInput === settings.pin
                    ? setPinOK(true)
                    : alert("Yanlış PIN")
                }
                className="w-full bg-indigo-600 text-white p-2 rounded"
              >
                GİRİŞ
              </button>
            </>
          ) : (
            <div className="space-y-2 text-sm">
              <label>Çocuk Adı</label>
              <input
                className="border p-2 w-full"
                value={settings.name}
                onChange={e =>
                  setSettings({ ...settings, name: e.target.value })
                }
              />

              <label>Günlük Limit</label>
              <input
                type="number"
                className="border p-2 w-full"
                value={settings.limit}
                onChange={e =>
                  setSettings({ ...settings, limit: +e.target.value })
                }
              />

              <label>Yeni PIN</label>
              <input
                type="password"
                className="border p-2 w-full"
                onChange={e =>
                  setSettings({ ...settings, pin: e.target.value })
                }
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* === ANALYSIS PANEL (BOŞ KALAMAZ) === */
function AnalysisPanel({ history, settings, star }) {
  const levels = settings.levels;

  const counts = {
    efsane: history.filter(h => h.level === "Efsane").length,
    iyi: history.filter(h => h.level === "İyi").length,
    sinirda: history.filter(h => h.level === "Sınırda").length,
    asti: history.filter(h => h.level === "Aştı").length,
  };

  const last7 = history.slice(0, 7).reverse();
  const max = Math.max(...last7.map(d => d.total), 1);

  return (
    <div className="space-y-4 text-sm">

      <div>
        <h3 className="font-bold mb-1">Seviye Dağılımı</h3>
        {Object.entries(counts).map(([k, v]) => (
          <div key={k} className="mb-1">
            <div className="flex justify-between text-xs">
              <span>{k}</span>
              <span>{v}</span>
            </div>
            <div className="bg-gray-200 h-2 rounded">
              <div
                className={`h-2 rounded bg-gradient-to-r ${levels[k].color}`}
                style={{ width: `${(v / history.length) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-bold mb-1">Son 7 Gün</h3>
        <div className="flex items-end gap-1 h-24">
          {last7.map((d, i) => (
            <div key={i} className="flex-1 text-center">
              <div
                className="bg-indigo-500 rounded"
                style={{ height: `${(d.total / max) * 100}%` }}
              />
              <div className="text-[10px]">{d.total}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-1">Haftalık Yıldız</h3>
        <div className="bg-gray-200 h-3 rounded">
          <div
            className="bg-yellow-400 h-3 rounded"
            style={{ width: `${(star / settings.weeklyStarTarget) * 100}%` }}
          />
        </div>
      </div>

    </div>
  );
}

/* === COUNTER === */
function Counter({ label, v, set, step }) {
  return (
    <div className="flex justify-between bg-gray-100 p-2 rounded">
      <span>{label}</span>
      <div className="flex gap-2">
        <button onClick={() => set(Math.max(0, v - step))}>−</button>
        <span>{v}</span>
        <button onClick={() => set(v + step)}>+</button>
      </div>
    </div>
  );
}
