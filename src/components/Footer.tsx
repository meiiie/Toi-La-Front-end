import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

export function Footer() {
  return (
    <footer className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-8">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h2 className="text-3xl font-bold mb-4">Ứng Dụng Bầu Cử Blockchain</h2>
          <p className="mb-2 text-gray-200 text-base">
            Ứng dụng bầu cử an toàn và minh bạch dựa trên công nghệ blockchain.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4">Liên hệ</h2>
          <p className="mb-2 text-gray-200 text-base">Email: chill@chill.com</p>
          <p className="mb-2 text-gray-200 text-base">Điện thoại: +84 123 456 789</p>
          <p className="text-gray-200 text-base">
            Địa chỉ: 123 Đường ABC, Quận XYZ, Thành phố Hải Phòng, Việt Nam
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4">Trường Đại Học Hàng Hải Việt Nam</h2>
          <p className="mb-2 text-gray-200 text-base">
            Địa chỉ: 484 Lạch Tray, Kênh Dương, Lê Chân, Hải Phòng, Việt Nam
          </p>
          <div className="rounded-lg overflow-hidden shadow-lg">
            <iframe
              width="100%"
              height="200"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              title="Map to Trường Đại Học Hàng Hải Việt Nam"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.1234567890123!2d106.6947662!3d20.8372291!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314a7a9c2ee478df%3A0x6039ffe1614ede5c!2sTr%C6%B0%E1%BB%9Dng%20%C4%90%E1%BA%A1i%20h%E1%BB%8Dc%20H%C3%A0ng%20h%E1%BA%A3i%20Vi%E1%BB%87t%20Nam!5e0!3m2!1svi!2s!4v1690000000000!5m2!1svi!2s"
              aria-label="Bản đồ đến Trường Đại Học Hàng Hải Việt Nam"
            ></iframe>
          </div>
          <p className="mt-4">
            <a
              href="https://www.google.com/maps/dir/?api=1&origin=My+Location&destination=Trường+Đại+Học+Hàng+Hải+Việt+Nam,484+Lạch+Tray,Kênh+Dương,Lê+Chân,Hải+Phòng,Việt+Nam&travelmode=driving"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline hover:text-gray-400"
            >
              Chỉ đường từ vị trí của bạn đến Trường Đại Học Hàng Hải Việt Nam
            </a>
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4">Theo dõi chúng tôi</h2>
          <div className="flex space-x-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-gray-400"
            >
              <FaFacebook size={24} />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-gray-400"
            >
              <FaTwitter size={24} />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-gray-400"
            >
              <FaInstagram size={24} />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-gray-400"
            >
              <FaLinkedin size={24} />
            </a>
          </div>
        </div>
      </div>
      <div className="mt-8 text-center text-sm border-t border-gray-400 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/privacy-policy" className="text-white hover:text-gray-400">
            Chính sách bảo mật
          </a>
          <a href="/terms-of-service" className="text-white hover:text-gray-400">
            Điều khoản sử dụng
          </a>
          <a href="/contact" className="text-white hover:text-gray-400">
            Liên hệ
          </a>
        </div>
        <p className="mt-4">&copy; 2025 Ứng Dụng Bầu Cử Blockchain. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
