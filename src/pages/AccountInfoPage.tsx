'use client';

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Switch } from '../components/ui/Switch';
import { Moon, Sun, Edit, Clock } from 'lucide-react';

export default function AccountInfoPage() {
  const user = useSelector((state: RootState) => state.users.user);
  const [darkMode, setDarkMode] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen text-2xl">Bạn chưa đăng nhập.</div>
    );
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div
      className={`min-h-screen p-8 transition-colors duration-200 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}
    >
      <div className="container mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{user.name}</h1>
              <Badge variant={user.status === 'Active' ? 'default' : 'destructive'}>
                {user.status}
              </Badge>
            </div>
          </div>
          <Switch
            checked={darkMode}
            onCheckedChange={toggleDarkMode}
            className="ml-4"
            icon={darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          />
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Thông tin cá nhân</CardTitle>
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="font-medium">Email:</dt>
                  <dd>{user.account.email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Số điện thoại:</dt>
                  <dd>{user.account.phone}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Tên đăng nhập:</dt>
                  <dd>{user.account.username}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vai trò và Quyền hạn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Vai trò:</h3>
                  <ul className="list-disc list-inside">
                    {user.roles.map((role) => (
                      <li key={role.id}>{role.name}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Quyền hạn:</h3>
                  <ul className="list-disc list-inside">
                    {user.roles
                      .flatMap((role) => role.permissions)
                      .map((permission, index) => (
                        <li key={index}>{permission}</li>
                      ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hoạt động gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {user.recentActivities?.map(
                  (
                    activity:
                      | string
                      | number
                      | boolean
                      | React.ReactElement<any, string | React.JSXElementConstructor<any>>
                      | Iterable<React.ReactNode>
                      | React.ReactPortal
                      | null
                      | undefined,
                    index: React.Key | null | undefined,
                  ) => (
                    <li key={index} className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{activity}</span>
                    </li>
                  ),
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
