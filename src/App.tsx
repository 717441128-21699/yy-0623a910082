import { useState, useEffect } from 'react';
import TodayCheck from './components/TodayCheck';
import ExceptionHandling from './components/ExceptionHandling';
import HandoverRecord from './components/HandoverRecord';

type TabKey = 'today' | 'exception' | 'handover';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const tabs = [
    { key: 'today' as const, label: '今日核对', icon: '📋', desc: '就诊流程核对' },
    { key: 'exception' as const, label: '异常处理', icon: '⚠️', desc: '护理资料稽核' },
    { key: 'handover' as const, label: '交班记录', icon: '🔄', desc: '班次交接清单' },
  ];

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${year}年${month}月${day}日 ${weekdays[date.getDay()]}`;
  };

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const getShift = () => {
    const hour = currentTime.getHours();
    if (hour >= 8 && hour < 17) return '白班';
    return '晚班';
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl">
              🦷
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                口腔诊所交叉核对系统
              </h1>
              <p className="text-xs text-gray-500">质控断点管理工具</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-lg font-mono text-gray-800">
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(currentTime)}
              </div>
            </div>
            <div className="h-10 w-px bg-gray-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-800">
                  当前：{getShift()}
                </div>
                <div className="text-xs text-gray-500">前台工作站</div>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                前
              </div>
            </div>
          </div>
        </div>

        <nav className="flex gap-1 px-6 border-t border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-5 py-3 flex items-center gap-2 transition-colors ${
                activeTab === tab.key
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <div className="text-left">
                <div className="font-medium">{tab.label}</div>
                <div className="text-xs opacity-70">{tab.desc}</div>
              </div>
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 overflow-hidden">
        {activeTab === 'today' && <TodayCheck />}
        {activeTab === 'exception' && <ExceptionHandling />}
        {activeTab === 'handover' && <HandoverRecord />}
      </main>

      <footer className="bg-white border-t border-gray-200 px-6 py-2 flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>口腔诊所质控系统 v1.0</span>
          <span>数据仅作演示用途</span>
        </div>
      </footer>
    </div>
  );
}
