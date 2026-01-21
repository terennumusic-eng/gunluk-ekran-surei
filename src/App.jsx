import { useEffect, useState } from "react";

/* =======================
   TARİH YARDIMCILARI
======================= */
function getISODate(date = new Date()) {
  return date.toISOString().split("T")[0];
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      date: getISODate(d),
      label: d.toLocaleDateString("tr-TR", { weekday: "short" }),
    });
  }
  return days;
}

function getWeeksOfMonth(year, month) {
  const weeks = [];
  let week = [];
  const date = new Date(year, month, 1);

  while (date.getMonth() === month) {
    week.push(getISODate(date));
    if (date.getDay() === 0) {
      weeks.push(week);
      week = [];
    }
    date.setDate(date.getDate() + 1);
  }
  if (week.length) weeks.push(week);
  return weeks;
}

/* =======================
   ANALİZ BİLEŞENLERİ
======================= */
function WeeklyChart({ dailyHistory }) {
  const today = getISODate();
  const days = getLast7Days();

  const data = days.map(d => {
    const found = dailyHistory.find(h => h.date === d.date);
    return {
      ...d,
      minutes: found ? found.totalMinutes : 0,
      isToday: d.date === today,
    };
  });

  const max = Math.max(...data.map(d => d.minutes), 60);

  return (
    <div className="mt-4">
      <h3 className="font-semibold mb-2">Haftalık</h3>
      <div className="flex items-end gap-2 h-40">
        {data.map(d => (
          <div key={d.date} className="flex-1 text-center">
            <div
              className={`mx-auto rounded ${
                d.isToday ? "bg-blue-600" : "bg-blue-400"
              }`}
              style={{ height: `${(d.minutes / max) * 100}%`, width: "70%" }}
            />
            <div className="text-xs mt-1">{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthlyChart({ dailyHistory }) {
  const now = new Date();
  const weeks = getWeeksOfMonth(now.getFullYear(), now.getMonth());

  const weeklyTotals = weeks.map(week =>
    week.reduce((sum, d) => {
      const found = dailyHistory.find(h => h.date === d);
      return sum + (found ? found.totalMinutes : 0);
    }, 0)
  );

  const max = Math.max(...weeklyTotals, 60);

  return (
    <div className="mt-6">
      <h3 className="font-semibold mb-2">Aylık (Haftalık Özet)</h3>
      <div className="flex items-end gap-3 h-32">
        {weeklyTotals.map((m, i) => (
          <div key={i} className="flex-1 text-center">
            <div
              className="mx-auto bg-green-500 rounded"
              style={{ height: `${(m / max) * 100}%`, width: "70%" }}
            />
            <div className="text-xs mt-1">{i + 1}.H</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisPanel({ dailyHistory }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-6 border-t pt-4">
      <button
        onClick={() => setOpen(!open)}
        className="font-semibold w-full text-left"
      >
        Analiz {open ? "▲" : "▼"}
      </button>

      {open && (
        <div className="mt-4">
          <WeeklyChart dailyHistory={dailyHistory} />
          <MonthlyChart dailyHistory={dailyHistory} />
        </div>
      )}
    </div>
  );
}

/* =======================
   ANA UYGULAMA
======================= */
export default function App() {
  const [todayMinutes, setTodayMinutes] = useState(
    Number(localStorage.getItem("todayMinutes") || 0)
  );
  const [lastDate, setLastDate] = useState(
    localStorage.getItem("lastDate") || getISODate()
  );
  const [dailyHistory, setDailyHistory] = useState(
    JSON.parse(localStorage.getItem("dailyHistory") || "[]")
  );

  /* === DAKİKA SAYACI (ESKİ MANTIK BOZULMAZ) === */
  useEffect(() => {
    const interval = setInterval(() => {
      setTodayMinutes(m => {
        const next = m + 1;
        localStorage.setItem("todayMinutes", next);
        return next;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  /* === GÜN DEĞİŞİMİ (00.00) === */
  useEffect(() => {
    const today = getISODate();
    if (lastDate !== today) {
      if (todayMinutes > 0) {
        const updated = [
          ...dailyHistory.filter(d => d.date !== lastDate),
          { date: lastDate, totalMinutes: todayMinutes },
        ];
        setDailyHistory(updated);
        localStorage.setItem("dailyHistory", JSON.stringify(updated));
      }

      setTodayMinutes(0);
      localStorage.setItem("todayMinutes", 0);
      setLastDate(today);
      localStorage.setItem("lastDate", today);
    }
  }, [todayMinutes, lastDate, dailyHistory]);

  /* === EMOJI / RENK (ESKİ DAVRANIŞ) === */
  const emoji =
    todayMinutes < 60 ? "😊" : todayMinutes < 120 ? "😐" : "😟";

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Günlük Ekran Süresi</h1>

      <div className="text-center text-5xl mb-2">{emoji}</div>

      <div className="text-center text-lg mb-4">
        Bugün: {todayMinutes} dk
      </div>

      {/* === ANALİZ PANELİ === */}
      <AnalysisPanel dailyHistory={dailyHistory} />
    </div>
  );
}
