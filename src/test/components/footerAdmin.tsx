export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-4 px-6">
      <div className="container mx-auto text-center text-gray-600 text-sm">
        <p>
          Mạng: POA Geth | RPC: https://geth.holihu.online/rpc | WebSocket:
          wss://geth.holihu.online/ws
        </p>
        <p className="mt-1">
          <a href="/admin-guide" className="text-primary hover:underline">
            Hướng dẫn quản trị
          </a>
        </p>
      </div>
    </footer>
  );
}
