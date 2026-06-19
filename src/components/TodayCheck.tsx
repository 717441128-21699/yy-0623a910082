import { useState, useMemo } from 'react';
import { mockVisitRecords, mockPatients } from '../data/mockData';
import type { VisitRecord } from '../types';

interface StepItem {
  key: string;
  name: string;
  completed: boolean;
  icon: string;
  details?: string[];
}

export default function TodayCheck() {
  const [searchText, setSearchText] = useState('');
  const [selectedVisit, setSelectedVisit] = useState<VisitRecord | null>(null);

  const filteredVisits = useMemo(() => {
    if (!searchText.trim()) return [];
    const text = searchText.toLowerCase();
    return mockVisitRecords.filter((visit) => {
      const patient = mockPatients.find((p) => p.id === visit.patientId);
      return (
        visit.patientName.toLowerCase().includes(text) ||
        patient?.phone.includes(text)
      );
    });
  }, [searchText]);

  const getSteps = (visit: VisitRecord): StepItem[] => {
    const steps: StepItem[] = [
      {
        key: 'registration',
        name: '挂号登记',
        completed: visit.registration.completed,
        icon: '📝',
        details: visit.registration.completed
          ? [
              `操作人：${visit.registration.operator}`,
              `时间：${visit.registration.time}`,
            ]
          : ['未完成挂号登记'],
      },
      {
        key: 'payment',
        name: '收费确认',
        completed: visit.payment.completed,
        icon: '💰',
        details: visit.payment.completed
          ? [
              `金额：¥${visit.payment.amount}`,
              `操作人：${visit.payment.operator}`,
              `时间：${visit.payment.time}`,
            ]
          : ['未完成收费'],
      },
      {
        key: 'treatment',
        name: '治疗执行',
        completed: visit.treatment.completed,
        icon: '🦷',
        details: visit.treatment.items.length > 0
          ? [
              ...visit.treatment.items.map(
                (item) => `${item.name} x${item.quantity} ¥${item.price}`
              ),
              `医生：${visit.treatment.doctor || '未指派'}`,
              `护士：${visit.treatment.nurse || '未指派'}`,
              visit.treatment.startTime
                ? `开始时间：${visit.treatment.startTime}`
                : '未开始',
              visit.treatment.endTime
                ? `结束时间：${visit.treatment.endTime}`
                : '未结束',
            ]
          : ['暂无治疗项目'],
      },
      {
        key: 'nextAppointment',
        name: '下次预约',
        completed: visit.nextAppointment.completed,
        icon: '📅',
        details: visit.nextAppointment.completed
          ? [
              `日期：${visit.nextAppointment.date}`,
              `时间：${visit.nextAppointment.time}`,
              `内容：${visit.nextAppointment.content}`,
            ]
          : ['未预约下次就诊'],
      },
    ];
    return steps;
  };

  const getStatusTag = (status: VisitRecord['status']) => {
    const config = {
      pending: { text: '待就诊', color: 'bg-gray-100 text-gray-600' },
      in_progress: { text: '治疗中', color: 'bg-blue-100 text-blue-700' },
      completed: { text: '已完成', color: 'bg-green-100 text-green-700' },
      abnormal: { text: '异常', color: 'bg-red-100 text-red-700' },
    };
    return config[status];
  };

  const getFirstIncompleteStep = (visit: VisitRecord): number => {
    const steps = getSteps(visit);
    for (let i = 0; i < steps.length; i++) {
      if (!steps[i].completed) return i;
    }
    return -1;
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">今日核对</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="输入患者姓名或手机号进行搜索..."
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setSelectedVisit(null);
            }}
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white shadow-sm"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
            🔍
          </span>
        </div>
      </div>

      {searchText && filteredVisits.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">📋</div>
          <p>未找到匹配的患者就诊记录</p>
        </div>
      )}

      {searchText && filteredVisits.length > 0 && !selectedVisit && (
        <div className="flex-1 overflow-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {filteredVisits.map((visit) => {
              const statusTag = getStatusTag(visit.status);
              const firstIncomplete = getFirstIncompleteStep(visit);
              return (
                <div
                  key={visit.id}
                  onClick={() => setSelectedVisit(visit)}
                  className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                        {visit.patientName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800 text-lg">
                          {visit.patientName}
                        </div>
                        <div className="text-sm text-gray-500">
                          预约时间：{visit.visitTime}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusTag.color}`}
                      >
                        {statusTag.text}
                      </span>
                      {firstIncomplete >= 0 && (
                        <div className="text-xs text-orange-600 mt-1">
                          卡在：
                          {getSteps(visit)[firstIncomplete].name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedVisit && (
        <div className="flex-1 overflow-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedVisit(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ←
                </button>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {selectedVisit.patientName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    就诊时间：{selectedVisit.visitDate}{' '}
                    {selectedVisit.visitTime}
                  </p>
                </div>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  getStatusTag(selectedVisit.status).color
                }`}
              >
                {getStatusTag(selectedVisit.status).text}
              </span>
            </div>

            <div className="space-y-4">
              {getSteps(selectedVisit).map((step, index) => {
                const firstIncomplete = getFirstIncompleteStep(selectedVisit);
                const isBlocked =
                  firstIncomplete >= 0 && index > firstIncomplete;
                const isCurrent = index === firstIncomplete;

                return (
                  <div
                    key={step.key}
                    className={`relative border rounded-lg p-4 transition-all ${
                      step.completed
                        ? 'border-green-300 bg-green-50'
                        : isCurrent
                        ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-200'
                        : isBlocked
                        ? 'border-gray-200 bg-gray-50 opacity-60'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${
                          step.completed
                            ? 'bg-green-500 text-white'
                            : isCurrent
                            ? 'bg-orange-500 text-white animate-pulse'
                            : 'bg-gray-300 text-gray-600'
                        }`}
                      >
                        {step.completed ? '✓' : step.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-800">
                            {step.name}
                          </h4>
                          {isCurrent && (
                            <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full font-medium">
                              当前步骤
                            </span>
                          )}
                          {isBlocked && (
                            <span className="px-2 py-0.5 bg-gray-400 text-white text-xs rounded-full font-medium">
                              待前置完成
                            </span>
                          )}
                        </div>
                        <ul className="mt-2 text-sm text-gray-600 space-y-1">
                          {step.details?.map((detail, i) => (
                            <li key={i}>• {detail}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    {index < getSteps(selectedVisit).length - 1 && (
                      <div
                        className={`absolute left-8 bottom-0 w-0.5 h-4 -mb-4 ${
                          step.completed ? 'bg-green-400' : 'bg-gray-300'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {selectedVisit.status !== 'completed' &&
              getFirstIncompleteStep(selectedVisit) >= 0 && (
                <div className="mt-6 p-4 bg-orange-100 border border-orange-300 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="font-bold text-orange-800">
                        当前卡在「
                        {
                          getSteps(selectedVisit)[
                            getFirstIncompleteStep(selectedVisit)
                          ].name
                        }
                        」环节
                      </p>
                      <p className="text-sm text-orange-600 mt-1">
                        请尽快完成该环节，以确保患者就诊流程完整
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {selectedVisit.status === 'completed' && (
              <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-bold text-green-800">
                      所有环节已完成
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      患者就诊资料完整，无需补正
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!searchText && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-lg">请输入患者姓名或手机号开始核对</p>
            <p className="text-sm mt-2">支持按姓名、手机号模糊搜索</p>
          </div>
        </div>
      )}
    </div>
  );
}
