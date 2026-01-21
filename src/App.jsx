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

/* LEVELS – YÜZDE BAZLI */
const LEVELS = {
  efsane: { max: 0.7, emoji: "🤩", color: "bg-purple-600", label: "Efsane" },
  iyi: { max: 0.85, emoji: "🙂", color: "bg-green-500", label: "İyi" },
  sinirda: { max: 1.0, emoji: "😐", color: "bg-yellow-400", label: "Sınırda" },
  asti: { max: 999, emoji: "😵", color: "bg-red-500", label: "Aşırı" },
};

export default function App() {
  const [tab, setTab] = useState("BUGÜN");

  const [sabah, setSabah] = useState(0);
  const [ogle, setOgle] = useState(0);
  const [aksam, setAksam] = useState(0);

  const [history, setHistory] = useState([]);
  const [showAnalysis, setShowAnalysis] = useState(false);

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

  /* AUTO DAY CHANGE (00:00) */
useEffect(() => {
  const checkDayChange = () => {
  const savedDate = JSON.parse(localStorage.getItem("app_v2_last_date"));
  const today = new Date().toDateString();

  if (!savedDate) {
    localStorage.setItem("app_v2_last_date", today);
    return;
  }

  if (savedDate !== today && total > 0) {
    completeDay();
  }

  localStorage.setItem("app_v2_last_date", today);

// WEEKLY RESET (PAZAR → PAZARTESİ)
const todayDay = new Date().getDay(); // 0 = Pazar
const lastWeekReset = JSON.parse(localStorage.getItem("app_v2_last_week")) || null;

if (todayDay === 1 && lastWeekReset !== today) {
  localStorage.setItem("app_v2_last_week", today);
}

};


  checkDayChange();
  const interval = setInterval(checkDayChange, 60 * 1000);
  return () => clearInterval(interval);
}, [total]);


  /* LEVEL CALC */
  function getLevel(minutes) {
    const ratio = minutes / settings.limit;
    if (ratio <= LEVELS.efsane.max) return { key: "efsane", ...LEVELS.efsane };
    if (ratio <= LEVELS.iyi.max) return { key: "iyi", ...LEVELS.iyi };
    if (ratio <= LEVELS.sinirda.max) return { key: "sinirda", ...LEVELS.sinirda };
    return { key: "asti", ...LEVELS.asti };
  }

  const todayLevel = getLevel(total);

/* MOTIVATION MESSAGE */
function getMotivation(levelKey) {
  switch (levelKey) {
    case "efsane":
      return "Harikasın! Bugün kontrol tamamen sende 👑";
    case "iyi":
      return "Gayet iyi gidiyorsun, biraz daha dikkat 👍";
    case "sinirda":
      return "Sınırdasın, az kaldı. Hadi toparlayalım 💪";
    case "asti":
      return "Bugün biraz fazla oldu. Yarın telafi edebiliriz 🌱";
    default:
      return "";
  }
}

const motivation = getMotivation(todayLevel.key);


  /* REWARD – GEÇMİŞTEN HESAP */
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
  const last7 = history
  .filter(d => typeof d.total === "number" && d.total >= 0 && d.key)
  .slice(0, 7)
  .reverse();

  const maxVal = Math.max(
    ...last7.map(d => d.total),
    settings.limit,
    1
  );

const limitRatio = Math.min(100, (settings.limit / maxVal) * 100);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-xl shadow max-w-md mx-auto p-4 space-y-4">

        {/* HEADER */}
        <div className={`text-center text-white p-3 rounded ${todayLevel.color}`}>
          <h1 className="font-bold">{settings.name}</h1>
          <div className="text-3xl">{todayLevel.emoji}</div>
          <div className="text-sm">
            ⭐ {star} · 👑 {crown}
          </div>
<div className="text-sm mt-1 opacity-90">
  {motivation}
</div>

        </div>

        {/* TABS */}
        <div className="grid grid-cols-4 gap-1">
          {["BUGÜN", "GEÇMİŞ", "ANALİZ", "AYAR"].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`p-2 ${
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
            <div className="text-center">
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

{/* MINI ANALYSIS (COLLAPSIBLE) */}
<div className="mt-4 border-t pt-3">
  <button
    onClick={() => setShowAnalysis(!showAnalysis)}
    className="w-full text-sm text-indigo-600"
  >
    {showAnalysis ? "▲ Analizi Gizle" : "▼ Haftalık Analizi Göster"}
  </button>

  {showAnalysis && (
    <div className="mt-3">
      {last7.length === 0 ? (
        <p className="text-center text-gray-400 text-sm">
          Henüz tamamlanmış gün yok
        </p>
      ) : (
        <div className="flex items-end gap-2 h-32">
          {last7.filter(d => LEVELS[d.key]).map((d, i) => {
            const lvl = LEVELS[d.key];
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className={`${lvl.color} w-full rounded`}
                  style={{
                    height: d.total === 0
                      ? "10%"
                      : `${(d.total / maxVal) * 100}%`
                  }}
                />
                <span className="text-xs mt-1">
                  {["Pzt","Sal","Çar","Per","Cum","Cts","Paz"][i]}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  )}
</div>

          </>
        )}

        {/* GEÇMİŞ */}
        {tab === "GEÇMİŞ" && (
          history.length === 0 ? (
            <p className="text-center text-gray-400">Kayıt yok</p>
          ) : (
            history.map(h => (
              <div key={h.id} className="flex justify-between bg-gray-100 p-2 rounded">
                <span>{h.date} · {h.emoji} {h.total}</span>
                <button onClick={() => deleteRecord(h.id)}>🗑️</button>
              </div>
            ))
          )
        )}

{/* ANALİZ */}
{tab === "ANALİZ" && (
  history.length === 0 || last7.length === 0 ? (
    <p className="text-center text-gray-400">Analiz için veri yok</p>
  ) : (
    <>
      {/* HAFTALIK */}
      <div className="relative flex items-end gap-2 h-40 border-b pb-2">
  {/* LIMIT LINE */}
  <div
    className="absolute left-0 right-0 border-t border-dashed border-red-400"
    style={{ bottom: `${limitRatio}%` }}
  />
        {last7.filter(d => LEVELS[d.key]).map((d, i) => {
          const lvl = LEVELS[d.key];
          return (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div
                className={`${lvl.color} w-full rounded`}
                style={{
                  height: d.total === 0
                    ? "10%"
                    : `${(d.total / maxVal) * 100}%`
                }}
              />
              <span className="text-xs mt-1">
                {["Pzt","Sal","Çar","Per","Cum","Cts","Paz"][i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* AYLIK – HAFTALIK ÖZET */}
      <div className="mt-4 flex items-end gap-3 h-32">
        {[0,1,2,3,4].map(w => {
          const week = history.slice(w * 7, w * 7 + 7);
          const sum = week.reduce((t, d) => t + (typeof d?.total === "number" ? d.total : 0), 0);
          return (
            <div key={w} className="flex-1 flex flex-col items-center">
              <div
                className="bg-green-500 w-full rounded"
                style={{
                  height: sum === 0
                    ? "10%"
                    : `${(sum / maxVal) * 100}%`
                }}
              />
              <span className="text-xs mt-1">{w + 1}.H</span>
            </div>
          );
        })}
      </div>

      <div className="text-center text-sm mt-2">
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
    <div className="flex justify-between bg-gray-100 p-2 rounded">
      <span>{label}</span>
      <div>
        <button onClick={() => set(Math.max(0, v - step))}>−</button>
        <span className="mx-2">{v}</span>
        <button onClick={() => set(v + step)}>+</button>
      </div>
    </div>
  );
}