import { useState, useMemo, useEffect } from 'react';
import { mockHandoverItems } from '../data/mockData';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage';
import type { HandoverItem } from '../types';

export default function HandoverRecord() {
  const [items, setItems] = useState<HandoverItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.HANDOVER_ITEMS, mockHandoverItems)
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    type: '未补签' as HandoverItem['type'],
    content: '',
    patientName: '',
    handler: '',
    remark: '',
  });
  const [currentUser] = useState('李护士');

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.HANDOVER_ITEMS, items);
  }, [items]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      pending: items.filter((item) => !item.handled).length,
      completed: items.filter((item) => item.handled).length,
      fromDayShift: items.filter((item) => item.fromShift === '白班').length,
    };
  }, [items]);

  const getTypeColor = (type: HandoverItem['type']) => {
    switch (type) {
      case '未补签':
        return 'bg-red-100 text-red-700';
      case '未回收同意书':
        return 'bg-orange-100 text-orange-700';
      case '未上传影像':
        return 'bg-yellow-100 text-yellow-700';
      case '其他':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: HandoverItem['type']) => {
    switch (type) {
      case '未补签':
        return '✍️';
      case '未回收同意书':
        return '📄';
      case '未上传影像':
        return '📷';
      case '其他':
        return '📋';
      default:
        return '📌';
    }
  };

  const handleAddItem = () => {
    if (!newItem.content.trim() || !newItem.patientName.trim()) {
      alert('请填写患者姓名和事项内容');
      return;
    }

    const item: HandoverItem = {
      id: `H${String(Date.now()).slice(-8)}`,
      type: newItem.type,
      content: newItem.content,
      patientName: newItem.patientName,
      visitId: `V${String(Date.now()).slice(-8)}`,
      fromShift: new Date().getHours() < 17 ? '白班' : '晚班',
      createTime: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      creator: currentUser,
      handled: false,
    };

    setItems([item, ...items]);
    setNewItem({
      type: '未补签',
      content: '',
      patientName: '',
      handler: '',
      remark: '',
    });
    setShowAddModal(false);
  };

  const handleComplete = (itemId: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              handled: true,
              handleTime: timeStr,
              handler: currentUser,
            }
          : item
      )
    );
  };

  const typeOptions: HandoverItem['type'][] = [
    '未补签',
    '未回收同意书',
    '未上传影像',
    '其他',
  ];

  const pendingItems = items.filter((item) => !item.handled);
  const completedItems = items.filter((item) => item.handled);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">交班记录</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>+</span>
          新增事项
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-500">事项总数</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-red-200 shadow-sm">
          <div className="text-2xl font-bold text-red-600">{stats.pending}</div>
          <div className="text-sm text-gray-500">待处理</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
          <div className="text-2xl font-bold text-green-600">
            {stats.completed}
          </div>
          <div className="text-sm text-gray-500">已完成</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">
            {stats.fromDayShift}
          </div>
          <div className="text-sm text-gray-500">白班遗留</div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            待处理事项
            <span className="text-sm font-normal text-gray-500">
              ({pendingItems.length})
            </span>
          </h3>
          <div className="flex-1 overflow-auto space-y-3">
            {pendingItems.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400">
                <div className="text-4xl mb-2">🎉</div>
                <p>暂无待处理事项</p>
              </div>
            ) : (
              pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getTypeIcon(item.type)}</span>
                      <div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                            item.type
                          )}`}
                        >
                          {item.type}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {item.fromShift}遗留
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {item.createTime}
                    </span>
                  </div>
                  <div className="mb-3">
                    <div className="font-medium text-gray-800 mb-1">
                      {item.patientName}
                    </div>
                    <p className="text-sm text-gray-600">{item.content}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      提交人：{item.creator}
                    </span>
                    <button
                      onClick={() => handleComplete(item.id)}
                      className="px-4 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      标记完成
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            已完成事项
            <span className="text-sm font-normal text-gray-500">
              ({completedItems.length})
            </span>
          </h3>
          <div className="flex-1 overflow-auto space-y-3">
            {completedItems.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400">
                <div className="text-4xl mb-2">📋</div>
                <p>暂无已完成事项</p>
              </div>
            ) : (
              completedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 rounded-lg border border-gray-200 p-4 opacity-75"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getTypeIcon(item.type)}</span>
                      <div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                            item.type
                          )}`}
                        >
                          {item.type}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {item.fromShift}遗留
                        </span>
                      </div>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      ✓ 已完成
                    </span>
                  </div>
                  <div className="mb-3">
                    <div className="font-medium text-gray-700 mb-1">
                      {item.patientName}
                    </div>
                    <p className="text-sm text-gray-500">{item.content}</p>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>提交：{item.creator} · {item.createTime}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-green-600 mt-1">
                      <span>
                        处理：{item.handler} · {item.handleTime}
                      </span>
                    </div>
                    {item.remark && (
                      <div className="mt-2 text-xs text-gray-500 bg-gray-100 p-2 rounded">
                        备注：{item.remark}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">新增交班事项</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  事项类型
                </label>
                <div className="flex flex-wrap gap-2">
                  {typeOptions.map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewItem({ ...newItem, type })}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        newItem.type === type
                          ? getTypeColor(type) + ' border-transparent'
                          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  患者姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newItem.patientName}
                  onChange={(e) =>
                    setNewItem({ ...newItem, patientName: e.target.value })
                  }
                  placeholder="请输入患者姓名"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  事项内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newItem.content}
                  onChange={(e) =>
                    setNewItem({ ...newItem, content: e.target.value })
                  }
                  placeholder="请描述需要交接的具体事项..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="p-5 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddItem}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
