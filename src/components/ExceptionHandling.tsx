import { useState, useMemo, useEffect } from 'react';
import { mockNursingAudits, nursingItems, commonReasons, nurses } from '../data/mockData';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage';
import type { NursingAuditRecord } from '../types';

export default function ExceptionHandling() {
  const [audits, setAudits] = useState<NursingAuditRecord[]>(() =>
    loadFromStorage(STORAGE_KEYS.NURSING_AUDITS, mockNursingAudits)
  );
  const [selectedAudit, setSelectedAudit] = useState<NursingAuditRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('list');
  const [newAuditPatient, setNewAuditPatient] = useState('');
  const [newAuditItems, setNewAuditItems] = useState<
    {
      itemId: string;
      itemName: string;
      passed: boolean;
      reason: string;
      remedyPerson: string;
    }[]
  >(
    nursingItems.map((item) => ({
      itemId: item.id,
      itemName: item.name,
      passed: true,
      reason: '',
      remedyPerson: '',
    }))
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.NURSING_AUDITS, audits);
  }, [audits]);

  const stats = useMemo(() => {
    return {
      total: audits.length,
      pending: audits.filter((a) => a.status === '待整改').length,
      inProgress: audits.filter((a) => a.status === '整改中').length,
      completed: audits.filter((a) => a.status === '已完成').length,
    };
  }, [audits]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case '待整改':
        return 'bg-red-100 text-red-700';
      case '整改中':
        return 'bg-orange-100 text-orange-700';
      case '已完成':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case '消毒追溯':
        return 'bg-purple-100 text-purple-700';
      case '器械包':
        return 'bg-blue-100 text-blue-700';
      case '术后告知':
        return 'bg-green-100 text-green-700';
      case '影像归档':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleItemPassChange = (index: number, passed: boolean) => {
    const newItems = [...newAuditItems];
    newItems[index].passed = passed;
    if (passed) {
      newItems[index].reason = '';
      newItems[index].remedyPerson = '';
    }
    setNewAuditItems(newItems);
    setValidationErrors([]);
  };

  const handleItemReasonChange = (index: number, reason: string) => {
    const newItems = [...newAuditItems];
    newItems[index].reason = reason;
    setNewAuditItems(newItems);
    setValidationErrors([]);
  };

  const handleItemRemedyPersonChange = (index: number, person: string) => {
    const newItems = [...newAuditItems];
    newItems[index].remedyPerson = person;
    setNewAuditItems(newItems);
    setValidationErrors([]);
  };

  const validateNewAudit = (): string[] => {
    const errors: string[] = [];
    if (!newAuditPatient.trim()) {
      errors.push('请输入患者姓名');
    }
    newAuditItems.forEach((item) => {
      if (!item.passed) {
        if (!item.reason.trim()) {
          errors.push(`「${item.itemName}」未填写不合格原因`);
        }
        if (!item.remedyPerson.trim()) {
          errors.push(`「${item.itemName}」未指定补正人`);
        }
      }
    });
    return errors;
  };

  const handleCreateAudit = () => {
    const errors = validateNewAudit();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const failedCount = newAuditItems.filter((item) => !item.passed).length;
    const newRecord: NursingAuditRecord = {
      id: `A${String(Date.now()).slice(-6)}`,
      visitId: `V${String(Date.now()).slice(-6)}`,
      patientName: newAuditPatient,
      auditDate: new Date().toISOString().split('T')[0],
      auditor: '护士长刘姐',
      items: newAuditItems.map((item) => ({
        itemId: item.itemId,
        itemName: item.itemName,
        passed: item.passed,
        reason: item.reason || undefined,
        remedyPerson: item.remedyPerson || undefined,
        remedied: false,
      })),
      status: failedCount === 0 ? '已完成' : '待整改',
    };

    setAudits([newRecord, ...audits]);
    setNewAuditPatient('');
    setNewAuditItems(
      nursingItems.map((item) => ({
        itemId: item.id,
        itemName: item.name,
        passed: true,
        reason: '',
        remedyPerson: '',
      }))
    );
    setValidationErrors([]);
    setActiveTab('list');
  };

  const handleRemedyItem = (auditId: string, itemId: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    setAudits((prev) =>
      prev.map((audit) => {
        if (audit.id !== auditId) return audit;
        const updatedItems = audit.items.map((item) =>
          item.itemId === itemId
            ? { ...item, remedied: true, remedyTime: timeStr }
            : item
        );
        const allRemedied = updatedItems
          .filter((item) => !item.passed)
          .every((item) => item.remedied);
        return {
          ...audit,
          items: updatedItems,
          status: allRemedied ? '已完成' : '整改中',
        };
      })
    );

    if (selectedAudit?.id === auditId) {
      const updatedItems = selectedAudit.items.map((item) =>
        item.itemId === itemId
          ? { ...item, remedied: true, remedyTime: timeStr }
          : item
      );
      const allRemedied = updatedItems
        .filter((item) => !item.passed)
        .every((item) => item.remedied);
      setSelectedAudit({
        ...selectedAudit,
        items: updatedItems,
        status: allRemedied ? '已完成' : '整改中',
      });
    }
  };

  const categories = ['消毒追溯', '器械包', '术后告知', '影像归档'];

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">护理资料稽核</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveTab('list');
              setSelectedAudit(null);
              setValidationErrors([]);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            稽核记录
          </button>
          <button
            onClick={() => {
              setActiveTab('new');
              setValidationErrors([]);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'new'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            新建稽核
          </button>
        </div>
      </div>

      {activeTab === 'list' && (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="text-2xl font-bold text-gray-800">
                {stats.total}
              </div>
              <div className="text-sm text-gray-500">总稽核数</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-red-200 shadow-sm">
              <div className="text-2xl font-bold text-red-600">
                {stats.pending}
              </div>
              <div className="text-sm text-gray-500">待整改</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm">
              <div className="text-2xl font-bold text-orange-600">
                {stats.inProgress}
              </div>
              <div className="text-sm text-gray-500">整改中</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
              <div className="text-2xl font-bold text-green-600">
                {stats.completed}
              </div>
              <div className="text-sm text-gray-500">已完成</div>
            </div>
          </div>

          {!selectedAudit ? (
            <div className="flex-1 overflow-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {audits.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">
                    <div className="text-4xl mb-2">📋</div>
                    <p>暂无稽核记录，点击右上角"新建稽核"开始</p>
                  </div>
                ) : (
                  audits.map((audit) => {
                    const failedCount = audit.items.filter(
                      (item) => !item.passed
                    ).length;
                    return (
                      <div
                        key={audit.id}
                        onClick={() => setSelectedAudit(audit)}
                        className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                              {audit.patientName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-800 text-lg">
                                {audit.patientName}
                              </div>
                              <div className="text-sm text-gray-500">
                                稽核时间：{audit.auditDate} · {audit.auditor}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                                audit.status
                              )}`}
                            >
                              {audit.status}
                            </span>
                            {failedCount > 0 && (
                              <div className="text-sm text-red-500 mt-1">
                                {failedCount} 项不合格
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSelectedAudit(null)}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      ←
                    </button>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {selectedAudit.patientName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        稽核时间：{selectedAudit.auditDate} ·{' '}
                        {selectedAudit.auditor}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                      selectedAudit.status
                    )}`}
                  >
                    {selectedAudit.status}
                  </span>
                </div>

                <div className="space-y-6">
                  {categories.map((category) => {
                    const categoryItems = nursingItems.filter(
                      (item) => item.category === category
                    );
                    const auditItems = categoryItems.map((item) =>
                      selectedAudit.items.find(
                        (ai) => ai.itemId === item.id
                      )
                    );

                    return (
                      <div key={category}>
                        <div className="flex items-center gap-2 mb-3">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(
                              category
                            )}`}
                          >
                            {category}
                          </span>
                          <span className="text-sm text-gray-500">
                            共 {categoryItems.length} 项
                          </span>
                        </div>
                        <div className="space-y-2">
                          {auditItems.map((item, index) => {
                            if (!item) return null;
                            return (
                              <div
                                key={item.itemId}
                                className={`p-4 border rounded-lg ${
                                  item.passed
                                    ? 'border-green-200 bg-green-50'
                                    : 'border-red-200 bg-red-50'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3">
                                    <span
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5 ${
                                        item.passed
                                          ? 'bg-green-500 text-white'
                                          : 'bg-red-500 text-white'
                                      }`}
                                    >
                                      {item.passed ? '✓' : '✗'}
                                    </span>
                                    <div>
                                      <div className="font-medium text-gray-800">
                                        {item.itemName}
                                      </div>
                                      {!item.passed && item.reason && (
                                        <div className="text-sm text-red-600 mt-1">
                                          原因：{item.reason}
                                        </div>
                                      )}
                                      {!item.passed && item.remedyPerson && (
                                        <div className="text-sm text-gray-600 mt-1">
                                          补正人：{item.remedyPerson}
                                        </div>
                                      )}
                                      {!item.passed && item.remedied && (
                                        <div className="text-sm text-green-600 mt-1">
                                          已整改 · {item.remedyTime}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {!item.passed && !item.remedied && (
                                    <button
                                      onClick={() =>
                                        handleRemedyItem(
                                          selectedAudit.id,
                                          item.itemId
                                        )
                                      }
                                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                    >
                                      标记整改
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'new' && (
        <div className="flex-1 overflow-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">新建稽核记录</h3>

            {validationErrors.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-red-500 text-lg">⚠️</span>
                  <span className="font-bold text-red-800">请完成以下必填项：</span>
                </div>
                <ul className="ml-7 text-sm text-red-600 space-y-1 list-disc">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                患者姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newAuditPatient}
                onChange={(e) => {
                  setNewAuditPatient(e.target.value);
                  setValidationErrors([]);
                }}
                placeholder="请输入患者姓名"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-6">
              {categories.map((category) => {
                const categoryItems = nursingItems.filter(
                  (item) => item.category === category
                );
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(
                          category
                        )}`}
                      >
                        {category}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {categoryItems.map((item) => {
                        const itemIndex = newAuditItems.findIndex(
                          (i) => i.itemId === item.id
                        );
                        const auditItem = newAuditItems[itemIndex];
                        if (!auditItem) return null;

                        const hasError = validationErrors.some(
                          (e) => e.includes(item.name)
                        );

                        return (
                          <div
                            key={item.id}
                            className={`p-4 border rounded-lg ${
                              hasError
                                ? 'border-red-400 bg-red-50'
                                : auditItem.passed
                                ? 'border-gray-200'
                                : 'border-red-300 bg-red-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800">
                                  {item.name}
                                </span>
                                {hasError && (
                                  <span className="text-xs text-red-500">
                                    ⚠️ 需完善
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`item-${item.id}`}
                                    checked={auditItem.passed}
                                    onChange={() =>
                                      handleItemPassChange(itemIndex, true)
                                    }
                                    className="w-4 h-4 text-green-600"
                                  />
                                  <span className="text-sm text-green-600">
                                    合格
                                  </span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`item-${item.id}`}
                                    checked={!auditItem.passed}
                                    onChange={() =>
                                      handleItemPassChange(itemIndex, false)
                                    }
                                    className="w-4 h-4 text-red-600"
                                  />
                                  <span className="text-sm text-red-600">
                                    不合格
                                  </span>
                                </label>
                              </div>
                            </div>

                            {!auditItem.passed && (
                              <div className="space-y-3 pt-3 border-t border-red-200">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    不合格原因 <span className="text-red-500">*</span>
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    {commonReasons.map((reason) => (
                                      <button
                                        key={reason}
                                        onClick={() =>
                                          handleItemReasonChange(
                                            itemIndex,
                                            reason
                                          )
                                        }
                                        className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                                          auditItem.reason === reason
                                            ? 'bg-red-100 border-red-300 text-red-700'
                                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                        }`}
                                      >
                                        {reason}
                                      </button>
                                    ))}
                                  </div>
                                  <input
                                    type="text"
                                    value={auditItem.reason}
                                    onChange={(e) =>
                                      handleItemReasonChange(
                                        itemIndex,
                                        e.target.value
                                      )
                                    }
                                    placeholder="或输入具体原因..."
                                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    指定补正人 <span className="text-red-500">*</span>
                                  </label>
                                  <select
                                    value={auditItem.remedyPerson}
                                    onChange={(e) =>
                                      handleItemRemedyPersonChange(
                                        itemIndex,
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    <option value="">请选择补正人</option>
                                    {nurses.map((nurse) => (
                                      <option key={nurse} value={nurse}>
                                        {nurse}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setActiveTab('list');
                  setValidationErrors([]);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateAudit}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                提交稽核
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
