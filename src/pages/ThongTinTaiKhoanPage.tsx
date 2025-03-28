'use client';

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Edit, Clock } from 'lucide-react';

export default function ThongTinTaiKhoanPage() {
  const user = useSelector((state: RootState) => state.dangNhapTaiKhoan.taiKhoan);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen text-2xl">Bạn chưa đăng nhập.</div>
    );
  }

  return (
    <>
      {/* <Helmet>
        <title>Thông tin tài khoản | Nền Tảng Bầu Cử Blockchain</title>
        <meta
          name="description"
          content="Trang thông tin tài khoản của bạn trên hệ thống Bầu Cử Blockchain."
        />
        <meta
          name="keywords"
          content="Bầu cử, Blockchain, Thông tin tài khoản, Vai trò, Quyền hạn"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:title" content="Thông tin tài khoản - Bầu Cử Blockchain" />
        <meta
          property="og:description"
          content="Trang thông tin tài khoản của bạn trên hệ thống Bầu Cử Blockchain."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="http://localhost:3000/account-info" />
        <meta property="og:image" content="http://localhost:3000/logo.png" />
      </Helmet> */}
      <main className="min-h-screen p-8 transition-colors duration-200 bg-gray-100 dark:bg-gray-900">
        <div className="container mx-auto">
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar} alt={user.tenDangNhap} />
                <AvatarFallback>{user.tenDangNhap.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">{user.tenDangNhap}</h1>
                <Badge variant={user.trangThai ? 'default' : 'destructive'}>
                  {user.trangThai ? 'Hoạt động' : 'Không hoạt động'}
                </Badge>
              </div>
            </div>
          </header>

          <section className="grid gap-6 md:grid-cols-2">
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
                    <dd>{user.email}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Số điện thoại:</dt>
                    <dd>{user.sdt}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Tên đăng nhập:</dt>
                    <dd>{user.tenDangNhap}</dd>
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
                      <li>{user?.vaiTro?.tenVaiTro}</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Quyền hạn:</h3>
                    <ul className="list-disc list-inside">
                      {/* {user.vaiTro.quyen.map((permission, index) => (
                        <li key={index}>{permission}</li>
                      ))} */}
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
                  {/* {user.recentActivities?.map((activity, index) => (
                    <li key={index} className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{activity}</span>
                    </li>
                  ))} */}
                </ul>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </>
  );
}
