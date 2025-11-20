
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Car, Wrench, Menu, X, Smartphone, HelpCircle, Share, MoreVertical, AlertTriangle, FileSpreadsheet, Recycle } from 'lucide-react';
import Dashboard from './components/Dashboard';
import VehicleList from './components/VehicleList';
import MaintenanceLog from './components/MaintenanceLog';
import RepairReport from './components/RepairReport';
import RecyclingBin from './components/RecyclingBin';
import { Vehicle, ServiceRecord, RepairRequest, ScrapItem, ViewState, VehicleType } from './types';
import { utils, writeFile } from 'xlsx';

// Initial Mock Data
const MOCK_VEHICLES: Vehicle[] = [
  { 
      id: '1', 
      type: VehicleType.Sedan,
      make: '丰田', 
      model: '凯美瑞', 
      year: 2018, 
      color: '银色', 
      currentMileage: 45000, 
      licensePlate: '京A 88888',
      vin: 'LFM1234567890ABCD',
      registrationDate: '2018-05-10'
  },
  { 
      id: '2', 
      type: VehicleType.SUV,
      make: '本田', 
      model: 'CR-V', 
      year: 2020, 
      color: '蓝色', 
      currentMileage: 22000, 
      licensePlate: '沪B 66666',
      engineNumber: 'L15B899999'
  },
];

const MOCK_RECORDS: ServiceRecord[] = [
  { id: '101', vehicleId: '1', date: '2023-10-15', type: '保养', description: '更换机油', cost: 300, mileageAtService: 44000 },
  { id: '102', vehicleId: '1', date: '2023-08-20', type: '维修', description: '更换刹车片', cost: 800, mileageAtService: 43500 },
  { id: '103', vehicleId: '2', date: '2024-01-10', type: '保养', description: '轮胎动平衡', cost: 150, mileageAtService: 21500 },
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
      const saved = localStorage.getItem('vehicles');
      return saved ? JSON.parse(saved) : MOCK_VEHICLES;
  });
  const [records, setRecords] = useState<ServiceRecord[]>(() => {
      const saved = localStorage.getItem('records');
      return saved ? JSON.parse(saved) : MOCK_RECORDS;
  });
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>(() => {
      const saved = localStorage.getItem('repairRequests');
      return saved ? JSON.parse(saved) : [];
  });
  const [scrapItems, setScrapItems] = useState<ScrapItem[]>(() => {
      const saved = localStorage.getItem('scrapItems');
      return saved ? JSON.parse(saved) : [];
  });

  // Persistence
  useEffect(() => {
    localStorage.setItem('vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem('records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('repairRequests', JSON.stringify(repairRequests));
  }, [repairRequests]);

  useEffect(() => {
    localStorage.setItem('scrapItems', JSON.stringify(scrapItems));
  }, [scrapItems]);

  // PWA Install Prompt Listener
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const addVehicle = (v: Vehicle) => setVehicles([...vehicles, v]);
  const removeVehicle = (id: string) => {
    setVehicles(vehicles.filter(v => v.id !== id));
  };

  const addRecord = (r: ServiceRecord) => setRecords([...records, r]);

  const addRepairRequest = (req: RepairRequest) => setRepairRequests([...repairRequests, req]);
  const updateRepairRequest = (req: RepairRequest) => {
    setRepairRequests(repairRequests.map(r => r.id === req.id ? req : r));
  };

  const addScrapItem = (item: ScrapItem) => setScrapItems([...scrapItems, item]);
  const updateScrapItem = (item: ScrapItem) => {
    setScrapItems(scrapItems.map(i => i.id === item.id ? item : i));
  };

  const handleExportData = () => {
      try {
          // 1. Prepare Data
          const vehicleData = vehicles.map(v => ({
              "ID": v.id,
              "车辆类型": v.type || '-',
              "品牌": v.make,
              "型号": v.model,
              "年份": v.year,
              "车牌": v.licensePlate || '-',
              "当前里程": v.currentMileage,
              "颜色": v.color,
              "车架号": v.vin || '-',
              "发动机号": v.engineNumber || '-',
              "注册日期": v.registrationDate || '-'
          }));

          const recordData = records.map(r => {
              const v = vehicles.find(v => v.id === r.vehicleId);
              return {
                  "日期": r.date,
                  "车辆": v ? `${v.make} ${v.model} (${v.licensePlate || '-'})` : '未知车辆',
                  "类型": r.type,
                  "描述": r.description,
                  "金额": r.cost,
                  "服务时里程": r.mileageAtService,
                  "备注": r.notes || '-'
              };
          });

          const repairData = repairRequests.map(r => {
              const v = vehicles.find(v => v.id === r.vehicleId);
              return {
                  "报修日期": r.reportDate,
                  "车辆": v ? `${v.make} ${v.model} (${v.licensePlate || '-'})` : '未知车辆',
                  "报修人": r.reporter,
                  "紧急程度": r.urgency,
                  "状态": r.status,
                  "故障描述": r.description,
                  "解决日期": r.resolvedDate || '-'
              };
          });

          const scrapData = scrapItems.map(s => {
              const v = vehicles.find(v => v.id === s.vehicleId);
              return {
                  "入库日期": s.entryDate,
                  "车辆": v ? `${v.make} ${v.model} (${v.licensePlate || '-'})` : '未知车辆',
                  "物品名称": s.itemName,
                  "状态": s.status,
                  "处理/变卖日期": s.disposalDate || '-',
                  "变卖金额": s.saleAmount || 0
              };
          });

          // 2. Create Workbook
          const wb = utils.book_new();

          // 3. Add Sheets
          const wsVehicles = utils.json_to_sheet(vehicleData);
          utils.book_append_sheet(wb, wsVehicles, "车辆列表");

          const wsRecords = utils.json_to_sheet(recordData);
          utils.book_append_sheet(wb, wsRecords, "维修记录");
          
          const wsRepairs = utils.json_to_sheet(repairData);
          utils.book_append_sheet(wb, wsRepairs, "报修记录");

          const wsScrap = utils.json_to_sheet(scrapData);
          utils.book_append_sheet(wb, wsScrap, "废品回收");

          // 4. Download
          const dateStr = new Date().toISOString().split('T')[0];
          writeFile(wb, `警务车辆数据_${dateStr}.xlsx`);
          
          setIsMenuOpen(false);
      } catch (error) {
          console.error("导出失败:", error);
          alert("导出失败，请重试。");
      }
  };

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard vehicles={vehicles} records={records} />;
      case 'vehicles':
        return <VehicleList vehicles={vehicles} onAddVehicle={addVehicle} onRemoveVehicle={removeVehicle} />;
      case 'log':
        return <MaintenanceLog vehicles={vehicles} records={records} onAddRecord={addRecord} />;
      case 'report':
        return <RepairReport vehicles={vehicles} requests={repairRequests} onAddRequest={addRepairRequest} onUpdateRequest={updateRepairRequest} />;
      case 'recycle':
        return <RecyclingBin vehicles={vehicles} items={scrapItems} onAddItem={addScrapItem} onUpdateItem={updateScrapItem} />;
      default:
        return <Dashboard vehicles={vehicles} records={records} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 select-none">
        {/* Top Bar */}
        <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-30 px-4 py-3 shadow-sm transition-all">
            <div className="flex justify-between items-center max-w-md mx-auto">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-1.5 rounded-lg">
                        <Wrench size={18} className="text-white" />
                    </div>
                    <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">警务保障车辆管理</h1>
                </div>
                <button 
                    onClick={() => setIsMenuOpen(true)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                >
                    <Menu size={24} />
                </button>
            </div>
        </header>

        {/* Side Menu Drawer */}
        {isMenuOpen && (
            <div className="fixed inset-0 z-50 flex justify-end">
                {/* Backdrop */}
                <div 
                    className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsMenuOpen(false)}
                ></div>
                
                {/* Drawer */}
                <div className="relative w-64 bg-white h-full shadow-2xl p-6 animate-in slide-in-from-right duration-300 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="font-bold text-lg text-slate-800">菜单</h2>
                        <button onClick={() => setIsMenuOpen(false)} className="text-slate-400">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-2 flex-1">
                        {installPrompt && (
                            <button 
                                onClick={handleInstallClick}
                                className="w-full flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors"
                            >
                                <Smartphone size={18} />
                                安装到手机 (App)
                            </button>
                        )}

                        <button 
                            onClick={handleExportData}
                            className="w-full flex items-center gap-3 p-3 text-green-700 bg-green-50 rounded-xl font-bold text-sm hover:bg-green-100 transition-colors"
                        >
                            <FileSpreadsheet size={18} />
                            导出数据 (Excel)
                        </button>

                        <button 
                            onClick={() => { setIsHelpOpen(true); setIsMenuOpen(false); }}
                            className="w-full flex items-center gap-3 p-3 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
                        >
                            <HelpCircle size={18} />
                            如何安装/使用
                        </button>
                        
                        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">数据统计</h3>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-600">车辆:</span>
                                <span className="font-bold">{vehicles.length}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-600">维修记录:</span>
                                <span className="font-bold">{records.length}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-600">故障报修:</span>
                                <span className="font-bold">{repairRequests.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">废品库存:</span>
                                <span className="font-bold">{scrapItems.filter(i => i.status === '库存').length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-400 mb-2">警务保障车辆管理 v1.7.0 (Local)</p>
                    </div>
                </div>
            </div>
        )}

        {/* Install Help Modal */}
        {isHelpOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-4">
                         <h3 className="text-lg font-bold text-slate-800">安装指南</h3>
                         <button onClick={() => setIsHelpOpen(false)} className="text-slate-400"><X size={24} /></button>
                    </div>
                    
                    <div className="space-y-4 text-sm text-slate-600">
                        <p>本应用无需下载安装包，采用 PWA 技术。安装后可完全<strong>离线使用</strong>。</p>
                        
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Smartphone size={16} className="text-green-600"/> 安卓 (Android)</h4>
                            <ol className="list-decimal list-inside space-y-1 text-xs">
                                <li>在 <strong>Chrome</strong> 浏览器中打开本网页。</li>
                                <li>点击右上角的菜单按钮 <MoreVertical size={10} className="inline"/>。</li>
                                <li>选择 <strong>“安装应用”</strong> 或 <strong>“添加到主屏幕”</strong>。</li>
                            </ol>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Smartphone size={16} className="text-blue-600"/> 苹果 (iOS)</h4>
                            <ol className="list-decimal list-inside space-y-1 text-xs">
                                <li>在 <strong>Safari</strong> 浏览器中打开本网页。</li>
                                <li>点击底部的分享按钮 <Share size={10} className="inline"/>。</li>
                                <li>向下滚动并选择 <strong>“添加到主屏幕”</strong>。</li>
                            </ol>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setIsHelpOpen(false)}
                        className="w-full mt-6 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-colors"
                    >
                        明白了
                    </button>
                </div>
            </div>
        )}

        {/* Main Content Area */}
        <main className="pt-20 px-4 max-w-md mx-auto min-h-screen pb-24">
            {renderView()}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 pb-safe z-40">
            <div className="flex justify-around items-center py-2 max-w-md mx-auto">
                <NavButton 
                    active={view === 'dashboard'} 
                    onClick={() => setView('dashboard')} 
                    icon={<LayoutDashboard size={22} />} 
                    label="概览" 
                />
                <NavButton 
                    active={view === 'report'} 
                    onClick={() => setView('report')} 
                    icon={<AlertTriangle size={22} />} 
                    label="报修" 
                />
                <NavButton 
                    active={view === 'log'} 
                    onClick={() => setView('log')} 
                    icon={<Wrench size={22} />} 
                    label="记录" 
                />
                 <NavButton 
                    active={view === 'recycle'} 
                    onClick={() => setView('recycle')} 
                    icon={<Recycle size={22} />} 
                    label="回收" 
                />
                <NavButton 
                    active={view === 'vehicles'} 
                    onClick={() => setView('vehicles')} 
                    icon={<Car size={22} />} 
                    label="车库" 
                />
            </div>
        </nav>
    </div>
  );
};

interface NavButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => {
    return (
        <button 
            onClick={onClick} 
            className={`flex flex-col items-center gap-1 transition-colors duration-200 w-full ${active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
            <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'scale-100'}`}>
                {icon}
            </div>
            <span className="text-[9px] font-bold transform scale-90">{label}</span>
        </button>
    )
}

export default App;