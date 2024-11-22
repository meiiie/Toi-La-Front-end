'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { updateUserSettings } from '../store/userSlice';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Switch } from '../components/ui/Switch';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar';
import {
  Bell,
  GitlabIcon as GitHub,
  Globe,
  Linkedin,
  Lock,
  Moon,
  Sun,
  Twitter,
  User,
  Laptop,
} from 'lucide-react';

export default function SettingsPage() {
  const user = useSelector((state: RootState) => state.users.user);
  const dispatch = useDispatch();

  const [displayName, setDisplayName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.account.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.account.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || '');
  const [address, setAddress] = useState(user?.address || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [linkedIn, setLinkedIn] = useState(user?.socialLinks?.linkedIn || '');
  const [github, setGithub] = useState(user?.socialLinks?.github || '');
  const [twitter, setTwitter] = useState(user?.socialLinks?.twitter || '');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);
  const [emailNotifications, setEmailNotifications] = useState(user?.notifications?.email || false);
  const [smsNotifications, setSmsNotifications] = useState(user?.notifications?.sms || false);
  const [inAppNotifications, setInAppNotifications] = useState(user?.notifications?.inApp || false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  const handleSaveSettings = () => {
    dispatch(
      updateUserSettings({
        name: displayName,
        avatar,
        theme,
        email,
        phoneNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        address,
        gender,
        bio,
        socialLinks: { linkedIn, github, twitter },
        twoFactorEnabled:
          typeof twoFactorEnabled === 'string' ? twoFactorEnabled === 'true' : twoFactorEnabled,
        notifications: {
          email: emailNotifications,
          sms: smsNotifications,
          inApp: inAppNotifications,
        },
      }),
    );
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatar(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    setDateOfBirth(selectedDate);
  };

  return (
    <div className="container mx-auto p-4 space-y-6 bg-gray-50 dark:bg-gray-900">
      <h1 className="text-3xl font-bold mb-6 text-blue-800 dark:text-blue-200">
        Cài đặt tài khoản
      </h1>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-blue-100 dark:bg-blue-800 rounded-lg p-1">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-white data-[state=active]:text-blue-800 dark:data-[state=active]:bg-blue-700 dark:data-[state=active]:text-white"
          >
            Hồ sơ
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-white data-[state=active]:text-blue-800 dark:data-[state=active]:bg-blue-700 dark:data-[state=active]:text-white"
          >
            Bảo mật
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-white data-[state=active]:text-blue-800 dark:data-[state=active]:bg-blue-700 dark:data-[state=active]:text-white"
          >
            Thông báo
          </TabsTrigger>
          <TabsTrigger
            value="appearance"
            className="data-[state=active]:bg-white data-[state=active]:text-blue-800 dark:data-[state=active]:bg-blue-700 dark:data-[state=active]:text-white"
          >
            Giao diện
          </TabsTrigger>
          <TabsTrigger
            value="account"
            className="data-[state=active]:bg-white data-[state=active]:text-blue-800 dark:data-[state=active]:bg-blue-700 dark:data-[state=active]:text-white"
          >
            Tài khoản
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin hồ sơ</CardTitle>
              <CardDescription>
                Cập nhật thông tin cá nhân và liên kết mạng xã hội của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={avatar} alt={displayName} />
                  <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <Input id="avatar" type="file" onChange={handleAvatarChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Tên hiển thị</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Số điện thoại</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth ? dateOfBirth.toString().split('T')[0] : ''}
                    onChange={handleDateChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Giới tính</Label>
                  <Input id="gender" value={gender} onChange={(e) => setGender(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Tiểu sử</Label>
                <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Liên kết mạng xã hội</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Linkedin className="w-4 h-4" />
                    <Input
                      placeholder="LinkedIn"
                      value={linkedIn}
                      onChange={(e) => setLinkedIn(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <GitHub className="w-4 h-4" />
                    <Input
                      placeholder="GitHub"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Twitter className="w-4 h-4" />
                    <Input
                      placeholder="Twitter"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings}>Lưu thay đổi</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt bảo mật</CardTitle>
              <CardDescription>Quản lý bảo mật tài khoản và phiên đăng nhập.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                <Input id="confirmPassword" type="password" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="twoFactor"
                  checked={
                    typeof twoFactorEnabled === 'string'
                      ? JSON.parse(twoFactorEnabled)
                      : twoFactorEnabled
                  }
                  onCheckedChange={setTwoFactorEnabled}
                />
                <Label htmlFor="twoFactor">Bật xác thực hai yếu tố</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings}>Cập nhật cài đặt bảo mật</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Tùy chọn thông báo</CardTitle>
              <CardDescription>Quản lý cách bạn nhận thông báo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="emailNotifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
                <Label htmlFor="emailNotifications">Thông báo qua email</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="smsNotifications"
                  checked={smsNotifications}
                  onCheckedChange={setSmsNotifications}
                />
                <Label htmlFor="smsNotifications">Thông báo qua SMS</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="inAppNotifications"
                  checked={inAppNotifications}
                  onCheckedChange={setInAppNotifications}
                />
                <Label htmlFor="inAppNotifications">Thông báo trong ứng dụng</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings}>Cập nhật cài đặt thông báo</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="appearance">
          <Card className="bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-700">
            <CardHeader className="border-b border-blue-100 dark:border-blue-700">
              <CardTitle className="text-blue-800 dark:text-blue-200">Cài đặt giao diện</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Tùy chỉnh giao diện của ứng dụng.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-700 dark:text-white dark:hover:bg-blue-800"
                  onClick={() => handleThemeChange('light')}
                >
                  <Sun className="mr-2 h-4 w-4" /> Chế độ sáng
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  className="bg-blue-700 text-white hover:bg-blue-800 dark:bg-blue-900 dark:text-white dark:hover:bg-blue-950"
                  onClick={() => handleThemeChange('dark')}
                >
                  <Moon className="mr-2 h-4 w-4" /> Chế độ tối
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  className="bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                  onClick={() => handleThemeChange('system')}
                >
                  <Laptop className="mr-2 h-4 w-4" /> Theo hệ thống
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings}>Lưu cài đặt giao diện</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Quản lý tài khoản</CardTitle>
              <CardDescription>Quản lý cài đặt tài khoản và tài khoản liên kết.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Tài khoản liên kết</h3>
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>Tài khoản Google</span>
                  <Button variant="outline" size="sm">
                    Hủy liên kết
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <GitHub className="w-4 h-4" />
                  <span>Tài khoản GitHub</span>
                  <Button variant="outline" size="sm">
                    Liên kết
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Hành động tài khoản</h3>
                <Button variant="destructive">Vô hiệu hóa tài khoản</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
