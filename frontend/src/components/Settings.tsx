import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { TabData, UserSettings, ThemeColors, ColorValue } from '../types';
import { loadSettings, saveSettings, getThemeColors } from '../services/SettingsService';
import { useTheme } from '../contexts/ThemeContext';
import IndexedDBService from '../services/IndexedDBService';
import { useAPIStatistics } from '../contexts/APIStatisticsContext';
import { X } from 'lucide-react'; // Import the X icon

interface SettingsProps {
  tabs: TabData[];
  onUpdateTabs: (updatedTabs: TabData[]) => void;
  onClose: () => void;
  onUpdateSettings: (newSettings: UserSettings) => void;
  currentSettings: UserSettings;
  isOpen: boolean;
}

const Settings: React.FC<SettingsProps> = ({ 
  tabs, 
  onUpdateTabs, 
  onClose, 
  onUpdateSettings,
  currentSettings,
  isOpen
}) => {
  const [settings, setSettings] = useState<UserSettings>(currentSettings);
  const { statistics, refreshStatistics } = useAPIStatistics();
  const { theme, setTheme, customThemes, setCustomThemes, applyTheme } = useTheme();

  const [editingTheme, setEditingTheme] = useState<string | null>(null);
  const [newThemeName, setNewThemeName] = useState('');

  
  const handleThemeChange = (themeName: string) => {
    setTheme(themeName);
    handleSettingChange('selectedTheme', themeName);
    applyTheme(themeName);
  };
  const handleCreateTheme = () => {
    if (newThemeName && !customThemes[newThemeName]) {
      const newTheme = {
        name: newThemeName,
        colors: { ...customThemes[theme].colors }
      };
      setCustomThemes({ ...customThemes, [newThemeName]: newTheme });
      setNewThemeName('');
    }
  };

  const handleEditTheme = (themeName: string) => {
    setEditingTheme(themeName);

  };

  const handleSaveTheme = () => {
    if (editingTheme) {
      handleSettingChange('customThemes', customThemes);
      setEditingTheme(null);
    }
  };

  
    const handleSettingChange = (key: keyof UserSettings, value: any) => {
      setSettings(prev => {
        const newSettings = { ...prev, [key]: value };
        onUpdateSettings(newSettings);
        saveSettings(newSettings);
        // if (key === 'colorTheme') {
        //   setTheme(value);
        // }
        return newSettings;
      });
    };

    useEffect(() => {
      if (isOpen) {
        refreshStatistics();
      }
    }, [isOpen, refreshStatistics]);
  

    useEffect(() => {
      const loadedSettings = loadSettings();
      if (loadedSettings) {
        setSettings(loadedSettings);
      }
    }, []);


  const handleTabAction = (action: 'copy' | 'rename' | 'delete' | 'toggle', tabId: string, newName?: string) => {
    let updatedTabs = [...tabs];
    switch (action) {
      case 'copy':
        const tabToCopy = tabs.find(tab => tab.id === tabId);
        if (tabToCopy) {
          const newTab = { ...tabToCopy, id: Date.now().toString(), title: `${tabToCopy.title} (Copy)`, isActive: true };
          updatedTabs.push(newTab);
        }
        break;
      case 'rename':
        updatedTabs = updatedTabs.map(tab => 
          tab.id === tabId ? { ...tab, title: newName || tab.title } : tab
        );
        break;
      case 'delete':
        updatedTabs = updatedTabs.filter(tab => tab.id !== tabId);
        break;
      case 'toggle':
        updatedTabs = updatedTabs.map(tab =>
          tab.id === tabId ? { ...tab, isActive: !tab.isActive } : tab
        );
        break;
    }
    onUpdateTabs(updatedTabs);
  };


  if (!isOpen) return null;

  
  const handleColorChange = (colorKey: keyof ThemeColors, value: string, type: 'rgb' | 'hex') => {
    if (editingTheme) {
      const updatedThemes = {
        ...customThemes,
        [editingTheme]: {
          ...customThemes[editingTheme],
          colors: {
            ...customThemes[editingTheme].colors,
            [colorKey]: {
              ...customThemes[editingTheme].colors[colorKey],
              [type]: value,
              ...(type === 'hex' ? { rgb: hexToRgb(value) } : { hex: rgbToHex(value) })
            }
          }
        }
      };
      setCustomThemes(updatedThemes);
    }
  };


  
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '';
  };

  const rgbToHex = (rgb: string): string => {
    const [r, g, b] = rgb.split(',').map(Number);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const colorLabels: { [K in keyof ThemeColors]: string } = {
    background: 'Background',
    foreground: 'Normal Text',
    card: 'Card Background',
    cardForeground: 'Card Text',
    detailedCardForeground: 'Detailed View Card Text', // Add this line
    primary: 'Primary Button',
    primaryForeground: 'Primary Button Text',
    secondary: 'Secondary Button',
    secondaryForeground: 'Secondary Button Text',
    muted: 'Muted Background',
    mutedForeground: 'Muted Text',
    accent: 'Accent',
    accentForeground: 'Accent Text',
    border: 'Border',
    input: 'Input Background',
    ring: 'Focus Ring',
    popover: 'Popover Background',
    popoverForeground: 'Popover Text ',
    chartLine: 'Chart Line Color',
    chartText: 'Chart Text Color',
    chartTimeSelector: 'Chart Time Selector Color',
  };
  
  return (
    
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-background w-full max-w-2xl mx-auto h-[90vh] flex flex-col rounded-lg overflow-hidden">
        {/* Persistent top bar */}
        <div className="bg-primary text-primary-foreground px-4 py-2 flex justify-between items-center">
          <h2 className="text-xl font-bold">Settings</h2>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="hover:bg-primary-foreground hover:text-primary rounded-full"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        {/* Scrollable content */}
        <div className="flex-grow overflow-y-auto p-4">
          <Card>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Refresh Interval (seconds)</Label>
                <Slider
                  min={60}
                  max={600}
                  step={30}
                  value={[settings.refreshInterval / 1000]}
                  onValueChange={([value]) => handleSettingChange('refreshInterval', value * 1000)}
                  className="w-full"
                />
                <div>{settings.refreshInterval / 1000} seconds</div>
              </div>

              <div className="space-y-2">
                <Label>Font Size</Label>
                <Slider
                  min={12}
                  max={24}
                  value={[settings.fontSize]}
                  onValueChange={([value]) => handleSettingChange('fontSize', value)}
                />
                <div>{settings.fontSize}px</div>
              </div>
              

              <div className="space-y-2">
                <Label>Stock Spacing</Label>
                <Select
                  value={settings.stockSpacing}
                  onValueChange={(value) => handleSettingChange('stockSpacing', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select spacing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="relaxed">Relaxed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* <div className="space-y-2">
                <Label>Color Theme</Label>
                <Select
                  value={settings.colorTheme}
                  onValueChange={(value: 'light' | 'dark' | 'system') => handleSettingChange('colorTheme', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}

              <div className="space-y-2">
                <Label>View Management</Label>
                {tabs.map(tab => (
                  <div key={tab.id} className="flex items-center space-x-2">
                    <Input
                      value={tab.title}
                      onChange={(e) => handleTabAction('rename', tab.id, e.target.value)}
                    />
                    <Button onClick={() => handleTabAction('copy', tab.id)}>Copy</Button>
                    <Button onClick={() => handleTabAction('toggle', tab.id)}>
                      {tab.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button onClick={() => handleTabAction('delete', tab.id)} variant="destructive">Delete</Button>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
  <Label>Theme</Label>
  <Select value={theme} onValueChange={handleThemeChange}>
    <SelectTrigger>
      <SelectValue placeholder="Select theme" />
    </SelectTrigger>
    <SelectContent>
      {Object.keys(customThemes).map((themeName) => (
        <SelectItem key={themeName} value={themeName}>
          {themeName}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  
  <div className="flex space-x-2">
    <Input
      value={newThemeName}
      onChange={(e) => setNewThemeName(e.target.value)}
      placeholder="New theme name"
    />
    <Button onClick={handleCreateTheme}>Create Theme</Button>
  </div>

  {editingTheme && (
    <div className="space-y-4">
      <h4 className="font-semibold">Editing: {editingTheme}</h4>
      <div className="grid grid-cols-2 gap-4">

      {Object.entries(customThemes[editingTheme].colors).map(([colorKey, colorValue]) => (
  <div key={colorKey} className="space-y-1">
    <Label>{colorLabels[colorKey as keyof ThemeColors] || colorKey}</Label>
    <div className="flex space-x-2">
      <Input
        type="text"
        value={colorValue.rgb}
        onChange={(e) => handleColorChange(colorKey as keyof ThemeColors, e.target.value, 'rgb')}
        className="flex-grow"
      />
      <Input
        type="color"
        value={colorValue.hex}
        onChange={(e) => handleColorChange(colorKey as keyof ThemeColors, e.target.value, 'hex')}
        className="w-10"
      />
    </div>
  </div>
))}
      </div>
      <Button onClick={handleSaveTheme}>Save Theme</Button>
    </div>
  )}

  {!editingTheme && (
    <Button onClick={() => handleEditTheme(theme)}>Edit Current Theme</Button>
  )}
</div>

              <div className="space-y-2">
                <Label>API Call Statistics</Label>
                {statistics ? (
                  <div className="space-y-1">
                    <p>Calls today: {statistics.today}</p>
                    <p>Lifetime calls: {statistics.lifetime}</p>
                    <p>Date range: {statistics.dateRange.start} to {statistics.dateRange.end}</p>
                  </div>
                ) : (
                  <p>Loading API call statistics...</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default Settings;