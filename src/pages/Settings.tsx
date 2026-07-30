import { Card, Button } from '../components/ui/primitives';
import { Settings as SettingsIcon, User, Bell, Shield, Database } from 'lucide-react';

export default function Settings() {
  const inputClass = "w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary flex items-center gap-2"><SettingsIcon size={22} /> Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your account and system preferences</p>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4 text-secondary font-semibold"><User size={16} /> Profile</div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">First Name</label><input className={inputClass} defaultValue="Fleet" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label><input className={inputClass} defaultValue="Manager" /></div>
          <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" className={inputClass} defaultValue="manager@catfleet.com" /></div>
        </div>
        <Button variant="primary" className="mt-4">Save Profile</Button>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4 text-secondary font-semibold"><Bell size={16} /> Notifications</div>
        <div className="space-y-3">
          {[
            ['Critical alerts via email', true],
            ['Maintenance reminders', true],
            ['Rental expiry notifications', true],
            ['Weekly fleet summary', false],
          ].map(([label, checked]) => (
            <label key={String(label)} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-700">{String(label)}</span>
              <input type="checkbox" defaultChecked={Boolean(checked)} className="rounded accent-primary" />
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4 text-secondary font-semibold"><Shield size={16} /> Security</div>
        <div className="space-y-3">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label><input type="password" className={inputClass} placeholder="••••••••" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">New Password</label><input type="password" className={inputClass} placeholder="••••••••" /></div>
        </div>
        <Button variant="secondary" className="mt-4">Update Password</Button>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4 text-secondary font-semibold"><Database size={16} /> Data & API</div>
        <p className="text-sm text-gray-500 mb-3">Configure backend API endpoint when ready to connect live data.</p>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">API Base URL</label><input className={inputClass} defaultValue="http://localhost:3001/api" /></div>
        <Button variant="ghost" className="mt-4">Test Connection</Button>
      </Card>
    </div>
  );
}
