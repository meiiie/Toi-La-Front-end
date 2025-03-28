import React from 'react';
import { Link } from 'react-router-dom';

interface FooterProps {
  isNetworkOnline: boolean;
}

export function Footer({ isNetworkOnline }: FooterProps) {
  return (
    <footer className="bg-white border-t border-[#ECEFF1] py-4">
      <div className="container mx-auto text-center text-sm text-[#37474F]">
        <p>
          Mạng: POA Geth {isNetworkOnline ? '(Trực tuyến)' : '(Ngoại tuyến)'} | RPC:
          https://geth.holihu.online/rpc | Triển khai qua Hardhat CMD trước
          <Link to="#" className="ml-2 text-[#0288D1] hover:text-[#01579B]">
            Hướng dẫn
          </Link>
        </p>
      </div>
    </footer>
  );
}
