const { ethers } = require("hardhat");
/**
 * Script thực hiện toàn bộ quy trình bầu cử:
 * 1. Tạo phiên bầu cử (nếu chưa có)
 * 2. Thêm cử tri và ứng viên 
 * 3. Cấp phiếu bầu cho cử tri
 * 4. Bỏ phiếu cho ứng viên
 * 5. Công bố kết quả
 */
async function main() {
    console.log("===== BẮT ĐẦU QUY TRÌNH BẦU CỬ HOÀN CHỈNH =====");
    
    // Lấy tài khoản
    const [deployer, newAccount] = await ethers.getSigners();
    console.log("Địa chỉ deployer:", deployer.address);
    
    if (!newAccount) {
        console.log("❌ Cần tạo một tài khoản mới để tránh lỗi admin proxy.");
        console.log("Thêm tài khoản mới vào hardhat.config.js: accounts = ['privatekey1', 'privatekey2']");
        return;
    }
    
    console.log("Tài khoản không phải admin:", newAccount.address);
    
    // === 0. CẤU HÌNH ===
    
    // Địa chỉ các contract
    const scwAddress = "0x8793F92C68C0C1d481B12Df753d3de6EbE58700e";
    const entryPointAddress = "0x5c1Ec052254B485A97eFeCdE6dEC5A7c3c171656";
    const paymasterAddress = "0x68eD6525Fa00B2A0AF28311280b46f6E03C5EE4a"; 
    const hluTokenAddress = "0x0c69a0bF43618D8ba8465e095F78AdB3A15F2666";
    const factoryAddress = "0x93e3b7720CAf68Fb4E4E0A9ca0152f61529D9900";
    const quanLyPhieuBauAddress = "0x9c244B5E1F168510B9b812573b1B667bd1E654c8";
    
    // Private key của session
    const sessionPrivateKey = "0xe5f32e8510730c9a48f00b154f19b6f42d1dd1fdfc35bb2ad749839f58cddaa2";
    const sessionKeySigner = new ethers.Wallet(sessionPrivateKey);
    const signingKey = new ethers.SigningKey(sessionPrivateKey);
    console.log("Sử dụng session key:", sessionKeySigner.address);
    
    // Kết nối đến các contract
    console.log("Kết nối đến các contracts...");
    const simpleAccount = await ethers.getContractAt("SimpleAccountNe", scwAddress);
    const entryPoint = await ethers.getContractAt("EntryPoint", entryPointAddress);
    const factory = await ethers.getContractAt("CuocBauCuFactory", factoryAddress);
    const hluToken = await ethers.getContractAt("HoLiHuToken", hluTokenAddress);
    
    // Kiểm tra session key còn hiệu lực
    const expiration = await simpleAccount.sessionKeys(sessionKeySigner.address);
    const currentTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
    console.log("Thời hạn session key:", new Date(Number(expiration) * 1000).toISOString());
    console.log("Thời gian hiện tại:", new Date(Number(currentTimestamp) * 1000).toISOString());
    
    if (expiration <= currentTimestamp) {
        console.log("❌ Session key đã hết hạn");
        return;
    }
    
    console.log("✅ Session key còn hiệu lực thêm", Number(expiration) - Number(currentTimestamp), "giây");
    
    // === 1. LẤY THÔNG TIN SERVER VÀ CUỘC BẦU CỬ ===
    
    console.log("\n=== LẤY THÔNG TIN CUỘC BẦU CỬ ===");
    
    // Lấy danh sách server của SCW
    console.log("Lấy danh sách server của SCW...");
    const userServers = await factory.layServerCuaNguoiDung(scwAddress);
    console.log("Danh sách server của SCW:", userServers.map(id => id.toString()));
    
    if (userServers.length === 0) {
        console.log("❌ Không tìm thấy server nào được tạo bởi SCW hiện tại!");
        console.log("Cần tạo server mới trước khi tiếp tục.");
        return;
    }
    
    // Lấy server cuối cùng (mới nhất)
    const serverId = userServers[userServers.length - 1];
    console.log("Sử dụng server mới nhất với ID:", serverId.toString());
    
    // Lấy thông tin server (cuộc bầu cử)
    console.log("Lấy thông tin cuộc bầu cử...");
    const serverInfo = await factory.layThongTinServer(serverId);
    const quanLyCuocBauCuAddress = serverInfo[0];
    
    // Kết nối tới contract QuanLyCuocBauCu và QLPhieuBau với tài khoản non-admin để tránh lỗi proxy
    const quanLyCuocBauCu = await ethers.getContractAt("QuanLyCuocBauCu", quanLyCuocBauCuAddress, newAccount);
    const quanLyPhieuBau = await ethers.getContractAt("QuanLyPhieuBauToanCuc", quanLyPhieuBauAddress, newAccount);
    
    console.log("Thông tin cuộc bầu cử:");
    console.log("- Địa chỉ quản lý:", quanLyCuocBauCuAddress);
    console.log("- Tên cuộc bầu cử:", serverInfo[1]);
    console.log("- Mô tả:", serverInfo[2]);
    console.log("- Trạng thái:", serverInfo[3]);
    
    // Kiểm tra ai là chủ sở hữu của cuộc bầu cử
    const electionBaseInfo = await quanLyCuocBauCu.layThongTinCoBan(1n);
    console.log("Chủ sở hữu cuộc bầu cử:", electionBaseInfo[0]);
    console.log("SCW address:", scwAddress);
    
    if (electionBaseInfo[0].toLowerCase() !== scwAddress.toLowerCase()) {
        console.log("⚠️ SCW hiện tại không phải là chủ sở hữu cuộc bầu cử");
        return;
    }
    
    // Trực tiếp kiểm tra quyền BANTOCHUC của SCW
    const BANTOCHUC = ethers.keccak256(ethers.toUtf8Bytes("BANTOCHUC"));
    const laBanToChuc = await quanLyCuocBauCu.hasRole(BANTOCHUC, scwAddress);
    console.log("SCW có quyền BANTOCHUC:", laBanToChuc);
    
    if (!laBanToChuc) {
        console.log("⚠️ SCW không có quyền BANTOCHUC, cần cấp quyền trước!");
        // Tạo UserOperation để SCW tự cấp quyền BANTOCHUC cho chính nó
        await capQuyenBanToChuc(
            entryPoint,
            simpleAccount,
            scwAddress,
            quanLyCuocBauCuAddress,
            signingKey,
            deployer
        );
    }
    
    // === 2. BẮT ĐẦU CUỘC BẦU CỬ (NẾU CHƯA BẮT ĐẦU) ===
    
    console.log("\n=== KIỂM TRA TRẠNG THÁI CUỘC BẦU CỬ ===");
    
    // Kiểm tra trạng thái cuộc bầu cử
    const isActive = electionBaseInfo[1]; // dangHoatDong
    console.log("Trạng thái cuộc bầu cử:", isActive ? "Đang hoạt động" : "Chưa hoạt động");
    
    if (!isActive) {
        console.log("\n=== BẮT ĐẦU CUỘC BẦU CỬ ===");
        await batDauCuocBauCu(
            quanLyCuocBauCu,
            quanLyCuocBauCuAddress,
            scwAddress,
            entryPoint,
            signingKey,
            currentTimestamp,
            paymasterAddress,
            deployer
        );
    }
    
    // === 3. TẠO PHIÊN BẦU CỬ MỚI ===
    
    // Kiểm tra HLU token allowance cho contract QuanLyCuocBauCu
    const allowanceForQuanLyCuocBauCu = await hluToken.allowance(scwAddress, quanLyCuocBauCuAddress);
    console.log("HLU token allowance cho QuanLyCuocBauCu:", ethers.formatEther(allowanceForQuanLyCuocBauCu));
    
    if (allowanceForQuanLyCuocBauCu < ethers.parseEther("10")) {
        console.log("\n=== APPROVE HLU CHO QUẢN LÝ CUỘC BẦU CỬ ===");
        await approveHLUToken(
            hluToken,
            hluTokenAddress,
            quanLyCuocBauCuAddress,
            simpleAccount,
            scwAddress,
            entryPoint,
            signingKey,
            deployer
        );
    }
    
    // Hỏi người dùng có muốn tạo phiên bầu cử mới không
    console.log("\n=== TẠO PHIÊN BẦU CỬ MỚI ===");
    let taoPhienMoi = true; // Mặc định không tạo phiên mới
    let phienBauCuId;
    
    // Nếu muốn tạo phiên mới, thực hiện tạo phiên
    if (taoPhienMoi) {
        phienBauCuId = await taoPhienBauCu(
            quanLyCuocBauCu,
            quanLyCuocBauCuAddress,
            scwAddress,
            entryPoint,
            signingKey,
            currentTimestamp,
            paymasterAddress,
            deployer
        );
    } else {
        // Lấy phiên bầu cử mới nhất
        const phienBauCuList = await quanLyCuocBauCu.layDanhSachPhienBauCu(1n, 0n, 10n);
        if (phienBauCuList && phienBauCuList.length > 0) {
            phienBauCuId = phienBauCuList[phienBauCuList.length - 1];
            console.log("Sử dụng phiên bầu cử hiện có ID:", phienBauCuId.toString());
        } else {
            console.log("❌ Không tìm thấy phiên bầu cử nào, cần tạo phiên mới!");
            return;
        }
    }
    
   // === 4. THÊM CỬ TRI VÀ ỨNG VIÊN ===

    console.log("\n=== THÊM CỬ TRI VÀ ỨNG VIÊN ===");

    // Danh sách 2 tài khoản cử tri thật
    const cuTriList = [
        "0x9c94B000d007a41284df66C4d6204AB2Ac8cfd9E",
        "0x0671FE3C25e955B3818444b3714EB7B08a1e30bd",
        "0xC1d2F0975Cd2329f2Ee7CAB64BD729335C5b30f4",
        "0xbAf3a8941FebB356a3A72feb8ea8030D251459aE"
    ];
    
    // Danh sách tài khoản cử tri với private key
    const cuTriAccounts = [
        {
            address: "0x9c94B000d007a41284df66C4d6204AB2Ac8cfd9E",
            privateKey: "127c0c490191fc20971b79c60e2ff4d1b12ef7167f11f59991a2e6dd80ecd9e2"
        },
        {
            address: "0x0671FE3C25e955B3818444b3714EB7B08a1e30bd",
            privateKey: "23583f68fe61550809f639c5a6fd90b4445d89a5d597c21bc4be8b475d176cd9"
        },
        {
            address: "0xC1d2F0975Cd2329f2Ee7CAB64BD729335C5b30f4",
            privateKey: "c6479a34e7744b9abfbddd7c46ccbcb224dcfa87e290fa7f6c17891b71555731"
        },
        {
            address: "0xbAf3a8941FebB356a3A72feb8ea8030D251459aE",
            privateKey: "8f689caa10b5879b7320558d9355e47cef53d68f4b5b3a5960b0efbd284e6803"
        }
    ];

    // Danh sách ứng viên cố định
    const candidateList = [
        "0xC1d2F0975Cd2329f2Ee7CAB64BD729335C5b30f4",
        "0xbAf3a8941FebB356a3A72feb8ea8030D251459aE"
    ];

    console.log(`Đã tạo danh sách ${cuTriList.length} cử tri và ${candidateList.length} ứng viên`);

    // Kiểm tra trạng thái phiên bầu cử trước khi thêm cử tri
    const isSessionActiveBeforeAddVoters = await quanLyCuocBauCu.laPhienHoatDong(1n, phienBauCuId);
    console.log("Trạng thái phiên bầu cử trước khi thêm cử tri:", isSessionActiveBeforeAddVoters ? "Đang hoạt động" : "Chưa hoạt động");

    if (isSessionActiveBeforeAddVoters) {
        console.log("⚠️ Phiên bầu cử đã bắt đầu, không thể thêm cử tri. Cần tạo phiên mới.");
        taoPhienMoi = true;
        phienBauCuId = await taoPhienBauCu(
            quanLyCuocBauCu,
            quanLyCuocBauCuAddress,
            scwAddress,
            entryPoint,
            signingKey,
            currentTimestamp,
            paymasterAddress,
            deployer
        );
    }

    // Sử dụng hàm themNhieuCuTri thay vì themCuTri từng cử tri một
    await themNhieuCuTri(
        cuTriList,
        phienBauCuId,
        quanLyCuocBauCu,
        quanLyCuocBauCuAddress,
        scwAddress,
        entryPoint,
        signingKey,
        currentTimestamp,
        paymasterAddress,
        deployer
    );

    // Sử dụng hàm themNhieuUngVien thay vì themUngVien từng ứng viên một
    await themNhieuUngVien(
        candidateList,
        phienBauCuId,
        quanLyCuocBauCu,
        quanLyCuocBauCuAddress,
        scwAddress,
        entryPoint,
        signingKey,
        currentTimestamp,
        paymasterAddress,
        deployer,
        hluToken,                 // Thêm hluToken
        hluTokenAddress           // Thêm hluTokenAddress
    );
    
    // === 5. BẮT ĐẦU PHIÊN BẦU CỬ ===
    
    console.log("\n=== BẮT ĐẦU PHIÊN BẦU CỬ ===");
    
    // Kiểm tra trạng thái phiên bầu cử
    const isSessionActive = await quanLyCuocBauCu.laPhienHoatDong(1n, phienBauCuId);
    console.log("Trạng thái phiên bầu cử:", isSessionActive ? "Đang hoạt động" : "Chưa hoạt động");
    
    if (!isSessionActive) {
        await batDauPhienBauCu(
            phienBauCuId,
            quanLyCuocBauCu,
            quanLyCuocBauCuAddress,
            scwAddress,
            entryPoint,
            signingKey,
            currentTimestamp,
            paymasterAddress,
            deployer
        );
    }
    
    // === 6. CẤP PHIẾU BẦU CHO CỬ TRI ===
    
    console.log("\n=== CẤP PHIẾU BẦU CHO CỬ TRI ===");
    
    // Lấy thông tin về QuanLyPhieuBauToanCuc
    console.log("Thông tin về QuanLyPhieuBauToanCuc:");
    console.log("- Địa chỉ QuanLyPhieuBau:", quanLyPhieuBauAddress);
    
    // Cấp phiếu bầu cho từng cử tri một 
    await capPhieuBauChoNhieuCuTri(
        cuTriList,
        phienBauCuId,
        quanLyCuocBauCu,
        quanLyCuocBauCuAddress,
        quanLyPhieuBau,
        scwAddress,
        entryPoint,
        signingKey,
        currentTimestamp,
        paymasterAddress,
        deployer,
        newAccount
    );
    
    // === 7. BỎ PHIẾU CHO ỨNG VIÊN ===
    
    console.log("\n=== BỎ PHIẾU CHO ỨNG VIÊN ===");
    
    // Xác nhận ứng viên hợp lệ
    const danhSachUngVien = await quanLyCuocBauCu.layDanhSachUngVien(1n, phienBauCuId);
    console.log("Danh sách ứng viên:", danhSachUngVien);
    
    if (!danhSachUngVien || danhSachUngVien.length === 0) {
        console.log("❌ Không tìm thấy ứng viên nào trong phiên bầu cử!");
        return;
    }
    
    // Bỏ phiếu cho ứng viên với các ví thực
    await boPhieuChoUngVien(
        cuTriAccounts,
        danhSachUngVien[0], // Chọn ứng viên đầu tiên
        serverId,
        phienBauCuId,
        quanLyCuocBauCu,
        quanLyPhieuBau,
        hluToken,
        quanLyPhieuBauAddress,
        deployer
    );
    
    // === 8. KẾT THÚC PHIÊN BẦU CỬ VÀ CÔNG BỐ KẾT QUẢ ===
    
    console.log("\n=== KẾT THÚC PHIÊN BẦU CỬ VÀ CÔNG BỐ KẾT QUẢ ===");
    
    // Kiểm tra kết quả bỏ phiếu
    console.log("Kết quả bỏ phiếu trước khi kết thúc phiên:");
    
    for (const ungVien of danhSachUngVien) {
        const soPhieu = await quanLyCuocBauCu.laySoPhieuUngVien(1n, phienBauCuId, ungVien);
        console.log(`Ứng viên ${ungVien}: ${soPhieu} phiếu`);
    }
    
    // Hỏi người dùng có muốn kết thúc phiên bầu cử không
    let ketThucPhien = false; // Mặc định không kết thúc phiên
    
    if (ketThucPhien) {
        await ketThucPhienBauCu(
            phienBauCuId,
            quanLyCuocBauCu,
            quanLyCuocBauCuAddress,
            scwAddress,
            entryPoint,
            signingKey,
            currentTimestamp,
            paymasterAddress,
            deployer
        );
        
        // Lấy danh sách ứng viên đắc cử
        const ungVienDacCu = await quanLyCuocBauCu.layDanhSachUngVienDacCu(1n, phienBauCuId);
        console.log("Ứng viên đắc cử:", ungVienDacCu);
    }
    
    console.log("\n===== HOÀN THÀNH QUY TRÌNH BẦU CỬ =====");
    console.log("Tóm tắt thông tin:");
    console.log("- Server ID (trong Factory):", serverId.toString());
    console.log("- ID cuộc bầu cử (trong QuanLyCuocBauCu):", "1");
    console.log("- Địa chỉ quản lý cuộc bầu cử:", quanLyCuocBauCuAddress);
    console.log("- ID phiên bầu cử:", phienBauCuId.toString());
    console.log("- Số cử tri đã thêm:", cuTriList.length);
    console.log("- Số ứng viên đã thêm:", candidateList.length);
}

/**
 * Cấp quyền BANTOCHUC cho SCW
 */
async function capQuyenBanToChuc(
    entryPoint,
    simpleAccount,
    scwAddress,
    quanLyCuocBauCuAddress,
    signingKey,
    deployer
) {
    console.log("Đang cấp quyền BANTOCHUC cho SCW...");
    
    // Lấy nonce hiện tại
    const currentNonce = await entryPoint.getNonce(scwAddress);
    console.log("Nonce hiện tại:", currentNonce.toString());
    
    // Chuẩn bị callData để cấp quyền BANTOCHUC
    const quanLyCuocBauCu = await ethers.getContractAt("QuanLyCuocBauCu", quanLyCuocBauCuAddress);
    const themBanToChucCallData = quanLyCuocBauCu.interface.encodeFunctionData("themBanToChuc", [scwAddress]);
    
    const executeThemBanToChucCallData = simpleAccount.interface.encodeFunctionData("execute", [
        quanLyCuocBauCuAddress, 
        0, 
        themBanToChucCallData
    ]);
    
    // Chuẩn bị paymasterAndData
    const currentTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
    const deadlineTime = Number(currentTimestamp) + 3600; // 1 giờ sau
    const validationTime = Number(currentTimestamp);
    
    // Lấy địa chỉ paymaster
    const factory = await ethers.getContractAt("CuocBauCuFactory", await quanLyCuocBauCu.factory());
    const paymasterAddress = await factory.hluPaymaster();
    
    // Chuẩn bị paymasterAndData - sử dụng uint48 thay vì uint256
    const paymasterAndData = ethers.concat([
        paymasterAddress,
        ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [deadlineTime]),
        ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [validationTime])
    ]);
    
    // Chuẩn bị UserOperation
    const userOp = {
        sender: scwAddress,
        nonce: currentNonce,
        initCode: "0x",
        callData: executeThemBanToChucCallData,
        callGasLimit: 1000000n,
        verificationGasLimit: 1000000n,
        preVerificationGas: 300000n,
        maxFeePerGas: ethers.parseUnits("5", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
        paymasterAndData: paymasterAndData,
        signature: "0x"
    };
    
    // Ký UserOperation
    const userOpHash = await entryPoint.layHashThaoTac(userOp);
    const signature = signingKey.sign(userOpHash);
    userOp.signature = signature.serialized;
    
    console.log("Gửi UserOperation để cấp quyền BANTOCHUC...");
    try {
        const tx = await entryPoint.xuLyCacThaoTac(
            [userOp],
            deployer.address,
            { 
                gasLimit: 5000000n,
            }
        );
        
        console.log("Giao dịch đã gửi:", tx.hash);
        const receipt = await tx.wait();
        console.log("Trạng thái giao dịch:", receipt?.status === 1 ? "✅ THÀNH CÔNG" : "❌ THẤT BẠI");
        
        // Kiểm tra lại quyền
        const BANTOCHUC = ethers.keccak256(ethers.toUtf8Bytes("BANTOCHUC"));
        const quanLyCuocBauCuNonAdmin = await ethers.getContractAt("QuanLyCuocBauCu", quanLyCuocBauCuAddress, deployer);
        const laBanToChuc = await quanLyCuocBauCuNonAdmin.hasRole(BANTOCHUC, scwAddress);
        console.log("Sau khi cấp quyền, SCW có quyền BANTOCHUC:", laBanToChuc);
        
        return laBanToChuc;
    } catch (error) {
        console.log("❌ Lỗi khi cấp quyền BANTOCHUC:", error.message);
        if (error.data) {
            console.log("Error data:", error.data);
        }
        return false;
    }
}

/**
 * Bắt đầu cuộc bầu cử
 */
async function batDauCuocBauCu(
    quanLyCuocBauCu,
    quanLyCuocBauCuAddress,
    scwAddress,
    entryPoint,
    signingKey,
    currentTimestamp,
    paymasterAddress,
    deployer
) {
    console.log("Đang bắt đầu cuộc bầu cử...");
    
    // Chuẩn bị dữ liệu để bắt đầu cuộc bầu cử
    const thoiGianKeoDai = 7n * 24n * 60n * 60n; // 7 ngày
    
    // Lấy nonce hiện tại
    let currentNonce = await entryPoint.getNonce(scwAddress);
    console.log("Nonce hiện tại:", currentNonce.toString());
    
    // Kết nối tới simpleAccount
    const simpleAccount = await ethers.getContractAt("SimpleAccountNe", scwAddress);
    
    // Chuẩn bị callData để bắt đầu cuộc bầu cử
    const batDauCuocBauCuCallData = quanLyCuocBauCu.interface.encodeFunctionData("batDauCuocBauCu", [
        1n, // ID cuộc bầu cử trong QuanLyCuocBauCu là 1
        thoiGianKeoDai
    ]);
    
    const executeCallData = simpleAccount.interface.encodeFunctionData("execute", [
        quanLyCuocBauCuAddress, 
        0, 
        batDauCuocBauCuCallData
    ]);
    
    // Chuẩn bị paymasterAndData
    const deadlineTime = Number(currentTimestamp) + 3600; // 1 giờ sau
    const validationTime = Number(currentTimestamp);
    
    const paymasterAndData = ethers.concat([
        paymasterAddress,
        ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [deadlineTime]),
        ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [validationTime])
    ]);
    
    // Chuẩn bị UserOperation
    const batDauCuocBauCuUserOp = {
        sender: scwAddress,
        nonce: currentNonce,
        initCode: "0x",
        callData: executeCallData,
        callGasLimit: 800000n,
        verificationGasLimit: 800000n,
        preVerificationGas: 200000n,
        maxFeePerGas: ethers.parseUnits("5", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
        paymasterAndData: paymasterAndData,
        signature: "0x"
    };
    
    // Ký UserOperation
    const batDauCuocBauCuUserOpHash = await entryPoint.layHashThaoTac(batDauCuocBauCuUserOp);
    const signature = signingKey.sign(batDauCuocBauCuUserOpHash);
    
    batDauCuocBauCuUserOp.signature = signature.serialized;
    
    console.log("Gửi giao dịch bắt đầu cuộc bầu cử...");
    try {
        const tx = await entryPoint.xuLyCacThaoTac(
            [batDauCuocBauCuUserOp],
            deployer.address,
            { 
                gasLimit: 5000000n,
            }
        );
        
        console.log("Giao dịch đã gửi:", tx.hash);
        const receipt = await tx.wait();
        console.log("Trạng thái giao dịch:", receipt?.status === 1 ? "✅ THÀNH CÔNG" : "❌ THẤT BẠI");
        
        // Đợi 2 giây để blockchain cập nhật
        console.log("Đợi 2 giây để blockchain cập nhật...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Kiểm tra lại trạng thái cuộc bầu cử
        const updatedElectionInfo = await quanLyCuocBauCu.layThongTinCoBan(1n);
        console.log("Trạng thái cuộc bầu cử sau khi bắt đầu:", updatedElectionInfo[1] ? "Đang hoạt động" : "Chưa hoạt động");
        
        return updatedElectionInfo[1];
    } catch (error) {
        console.log("❌ Lỗi khi bắt đầu cuộc bầu cử:", error.message);
        if (error.data) {
            console.log("Error data:", error.data);
        }
        return false;
    }
}

/**
 * Approve HLU token cho contract
 */
async function approveHLUToken(
    hluToken,
    hluTokenAddress,
    quanLyCuocBauCuAddress,
    simpleAccount,
    scwAddress,
    entryPoint,
    signingKey,
    deployer
) {
    console.log("Đang approve HLU token cho QuanLyCuocBauCu...");
    
    // Lấy nonce hiện tại
    let currentNonce = await entryPoint.getNonce(scwAddress);
    console.log("Nonce hiện tại:", currentNonce.toString());
    
    // Lấy timestamp hiện tại
    const currentTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
    
    // Lấy địa chỉ paymaster từ factory
    const quanLyCuocBauCu = await ethers.getContractAt("QuanLyCuocBauCu", quanLyCuocBauCuAddress);
    const factory = await ethers.getContractAt("CuocBauCuFactory", await quanLyCuocBauCu.factory());
    const paymasterAddress = await factory.hluPaymaster();
    
    // Tạo và gửi giao dịch approve
    const approveCallData = hluToken.interface.encodeFunctionData("approve", [
        quanLyCuocBauCuAddress, 
        ethers.parseEther("100") // Approve 100 HLU cho nhiều cử tri
    ]);
    
    const executeApproveCallData = simpleAccount.interface.encodeFunctionData("execute", [
        hluTokenAddress, 
        0, 
        approveCallData
    ]);
    
    // Chuẩn bị paymasterAndData
    const deadlineTime = Number(currentTimestamp) + 3600; // 1 giờ sau
    const validationTime = Number(currentTimestamp);
    
    const paymasterAndData = ethers.concat([
        paymasterAddress,
        ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [deadlineTime]),
        ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [validationTime])
    ]);
    
    // Chuẩn bị UserOperation với gas limit cao hơn
    const approveUserOp = {
        sender: scwAddress,
        nonce: currentNonce,
        initCode: "0x",
        callData: executeApproveCallData,
        callGasLimit: 800000n,        // Tăng gas limit
        verificationGasLimit: 800000n, // Tăng gas limit
        preVerificationGas: 200000n,  // Tăng gas limit
        maxFeePerGas: ethers.parseUnits("5", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
        paymasterAndData: paymasterAndData,
        signature: "0x"
    };
    
    // Ký UserOperation
    const approveUserOpHash = await entryPoint.layHashThaoTac(approveUserOp);
    const approveSignature = signingKey.sign(approveUserOpHash);
    
    approveUserOp.signature = approveSignature.serialized;
    
    console.log("Gửi giao dịch approve...");
    try {
        const tx = await entryPoint.xuLyCacThaoTac(
            [approveUserOp],
            deployer.address,
            { 
                gasLimit: 5000000n,
            }
        );
        
        console.log("Giao dịch đã gửi:", tx.hash);
        const receipt = await tx.wait();
        console.log("Trạng thái giao dịch:", receipt?.status === 1 ? "✅ THÀNH CÔNG" : "❌ THẤT BẠI");
        
        // Đợi 2 giây để blockchain cập nhật
        console.log("Đợi 2 giây để blockchain cập nhật...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Kiểm tra lại allowance
        const newAllowance = await hluToken.allowance(scwAddress, quanLyCuocBauCuAddress);
        console.log("Allowance mới cho QuanLyCuocBauCu:", ethers.formatEther(newAllowance));
        
        return newAllowance;
    } catch (error) {
        console.log("❌ Lỗi khi approve token:", error.message);
        if (error.data) {
            console.log("Error data:", error.data);
        }
        return 0n;
    }
}

/**
 * Tạo phiên bầu cử mới
 */
async function taoPhienBauCu(
    quanLyCuocBauCu,
    quanLyCuocBauCuAddress,
    scwAddress,
    entryPoint,
    signingKey,
    currentTimestamp,
    paymasterAddress,
    deployer
) {
    console.log("Đang tạo phiên bầu cử mới...");
    
    // Lấy nonce hiện tại
    let currentNonce = await entryPoint.getNonce(scwAddress);
    console.log("Nonce hiện tại:", currentNonce.toString());
    
    // Kết nối tới simpleAccount
    const simpleAccount = await ethers.getContractAt("SimpleAccountNe", scwAddress);
    
    // Tham số cho tạo phiên bầu cử
    const thoiGianKeoDaiPhien = 3n * 24n * 60n * 60n; // 3 ngày
    const soCuTriToiDa = 150n; // Tối đa 150 cử tri
    
    // Chuẩn bị callData để tạo phiên bầu cử
    const taoPhienCallData = quanLyCuocBauCu.interface.encodeFunctionData("taoPhienBauCu", [
        1n, // ID cuộc bầu cử trong QuanLyCuocBauCu là 1
        thoiGianKeoDaiPhien,
        soCuTriToiDa
    ]);
    
    const executeTaoPhienCallData = simpleAccount.interface.encodeFunctionData("execute", [
        quanLyCuocBauCuAddress, 
        0, 
        taoPhienCallData
    ]);
    
    // Chuẩn bị paymasterAndData
    const deadlineTime = Number(currentTimestamp) + 3600; // 1 giờ sau
    const validationTime = Number(currentTimestamp);
    
    const paymasterAndData = ethers.concat([
        paymasterAddress,
        ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [deadlineTime]),
        ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [validationTime])
    ]);
    
    // Chuẩn bị UserOperation
    const taoPhienUserOp = {
        sender: scwAddress,
        nonce: currentNonce,
        initCode: "0x",
        callData: executeTaoPhienCallData,
        callGasLimit: 800000n,
        verificationGasLimit: 800000n,
        preVerificationGas: 200000n,
        maxFeePerGas: ethers.parseUnits("5", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
        paymasterAndData: paymasterAndData,
        signature: "0x"
    };
    
    // Ký UserOperation
    const taoPhienUserOpHash = await entryPoint.layHashThaoTac(taoPhienUserOp);
    const taoPhienSignature = signingKey.sign(taoPhienUserOpHash);
    
    taoPhienUserOp.signature = taoPhienSignature.serialized;
    
    console.log("Gửi giao dịch tạo phiên bầu cử...");
    let phienBauCuId;
    try {
        const tx = await entryPoint.xuLyCacThaoTac(
            [taoPhienUserOp],
            deployer.address,
            { 
                gasLimit: 5000000n,
            }
        );
        
        console.log("Giao dịch đã gửi:", tx.hash);
        const receipt = await tx.wait();
        console.log("Trạng thái giao dịch:", receipt?.status === 1 ? "✅ THÀNH CÔNG" : "❌ THẤT BẠI");
        
        // Đợi 2 giây để blockchain cập nhật
        console.log("Đợi 2 giây để blockchain cập nhật...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Tìm event PhienBauCuDaTao để lấy ID phiên bầu cử
        const phienBauCuEvents = receipt?.logs
            .map(log => {
                try {
                    return quanLyCuocBauCu.interface.parseLog({ topics: log.topics, data: log.data });
                } catch (e) {
                    return null;
                }
            })
            .filter(event => event && event.name === "PhienBauCuDaTao");
        
        if (phienBauCuEvents && phienBauCuEvents.length > 0) {
            phienBauCuId = phienBauCuEvents[0].args[1]; // idPhienBauCu
            console.log("ID phiên bầu cử mới:", phienBauCuId.toString());
        } else {
            console.log("❌ Không thể xác định ID phiên bầu cử mới từ event!");
            
            // Truy vấn danh sách phiên bầu cử để xác định ID mới nhất
            const phienBauCuList = await quanLyCuocBauCu.layDanhSachPhienBauCu(1n, 0n, 10n);
            if (phienBauCuList && phienBauCuList.length > 0) {
                phienBauCuId = phienBauCuList[phienBauCuList.length - 1];
                console.log("ID phiên bầu cử mới nhất từ danh sách:", phienBauCuId.toString());
            } else {
                console.log("❌ Không thể lấy danh sách phiên bầu cử!");
                return null;
            }
        }
        
        return phienBauCuId;
    } catch (error) {
        console.log("❌ Lỗi khi tạo phiên bầu cử:", error.message);
        if (error.data) {
            console.log("Error data:", error.data);
        }
        return null;
    }
}

/**
 * Thêm nhiều cử tri vào phiên bầu cử cùng một lúc
 */
async function themNhieuCuTri(
    cuTriList,
    phienBauCuId,
    quanLyCuocBauCu,
    quanLyCuocBauCuAddress,
    scwAddress,
    entryPoint,
    signingKey,
    currentTimestamp,
    paymasterAddress,
    deployer
) {
    console.log(`Đang thêm ${cuTriList.length} cử tri vào phiên bầu cử cùng một lúc...`);
    
    // Kết nối tới simpleAccount
    const simpleAccount = await ethers.getContractAt("SimpleAccountNe", scwAddress);
    
    // Kiểm tra xem có cử tri nào đã được thêm vào danh sách cử tri chưa
    console.log("Kiểm tra cử tri đã tồn tại...");
    const existingVoters = [];
    const newVoters = [];
    
    // Lấy số cử tri tối đa từ phiên bầu cử
    const phienInfo = await quanLyCuocBauCu.layThongTinPhienBauCu(1n, phienBauCuId);
    const soCuTriToiDa = Number(phienInfo[3]);
    const soCuTriHienTai = Number(phienInfo[5]);
    
    console.log(`Phiên bầu cử có thể chứa tối đa ${soCuTriToiDa} cử tri, hiện có ${soCuTriHienTai} cử tri.`);
    
    if (soCuTriHienTai + cuTriList.length > soCuTriToiDa) {
        console.log(`⚠️ Cảnh báo: Số cử tri cần thêm (${cuTriList.length}) vượt quá giới hạn của phiên (${soCuTriToiDa - soCuTriHienTai} còn lại).`);
        console.log(`Sẽ chỉ thêm ${soCuTriToiDa - soCuTriHienTai} cử tri.`);
        cuTriList = cuTriList.slice(0, soCuTriToiDa - soCuTriHienTai);
    }
    
    // Kiểm tra sơ bộ 5 cử tri đầu tiên để ước tính tỷ lệ trùng lặp
    let duplicateCount = 0;
    for (let i = 0; i < Math.min(5, cuTriList.length); i++) {
        try {
            const laCuTri = await quanLyCuocBauCu.laCuTri(1n, phienBauCuId, cuTriList[i]);
            if (laCuTri) {
                duplicateCount++;
            }
        } catch (error) {
            console.log(`Lỗi khi kiểm tra cử tri ${cuTriList[i]}:`, error.message);
        }
    }
    
    // Ước tính tỷ lệ trùng lặp dựa trên mẫu kiểm tra
    const estimatedDuplicateRate = duplicateCount / Math.min(5, cuTriList.length);
    console.log(`Ước tính khoảng ${Math.round(estimatedDuplicateRate * 100)}% cử tri đã tồn tại.`);
    
    // Quyết định có kiểm tra từng cử tri hay không
    if (estimatedDuplicateRate > 0.3) {
        console.log("Đang kiểm tra tất cả các cử tri để loại bỏ trùng lặp...");
        for (let i = 0; i < cuTriList.length; i++) {
            if (i % 20 === 0) {
                console.log(`Đã kiểm tra ${i}/${cuTriList.length} cử tri...`);
            }
            try {
                const laCuTri = await quanLyCuocBauCu.laCuTri(1n, phienBauCuId, cuTriList[i]);
                if (laCuTri) {
                    existingVoters.push(cuTriList[i]);
                } else {
                    newVoters.push(cuTriList[i]);
                }
            } catch (error) {
                console.log(`❌ Lỗi khi kiểm tra cử tri ${cuTriList[i]}:`, error.message);
            }
        }
    } else {
        // Nếu tỷ lệ trùng lặp thấp, giả định tất cả đều là cử tri mới
        newVoters.push(...cuTriList);
        console.log("Tỷ lệ trùng lặp thấp, bỏ qua kiểm tra chi tiết.");
    }
    
    console.log(`Có ${existingVoters.length} cử tri đã tồn tại trong phiên bầu cử.`);
    console.log(`Sẽ thêm ${newVoters.length} cử tri mới vào phiên bầu cử.`);
    
    if (newVoters.length === 0) {
        console.log("Không có cử tri mới để thêm, bỏ qua bước này.");
        return;
    }
    
    // Chia danh sách cử tri thành các nhóm nhỏ hơn để tránh lỗi gas limit
    // Tăng batch size lên 100
    const BATCH_SIZE = 100;
    const batches = [];
    
    for (let i = 0; i < newVoters.length; i += BATCH_SIZE) {
        batches.push(newVoters.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`Chia thành ${batches.length} nhóm để thêm cử tri.`);
    
    // Thêm từng nhóm cử tri
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`Đang xử lý nhóm ${batchIndex + 1}/${batches.length} với ${batch.length} cử tri`);
        
        try {
            // Lấy nonce hiện tại
            let currentNonce = await entryPoint.getNonce(scwAddress);
            console.log("Nonce hiện tại:", currentNonce.toString());
            
            // Chuẩn bị callData để thêm nhiều cử tri
            const themNhieuCuTriCallData = quanLyCuocBauCu.interface.encodeFunctionData("themNhieuCuTri", [
                1n, // ID cuộc bầu cử trong QuanLyCuocBauCu là 1
                phienBauCuId,
                batch
            ]);
            
            const executeThemNhieuCuTriCallData = simpleAccount.interface.encodeFunctionData("execute", [
                quanLyCuocBauCuAddress, 
                0, 
                themNhieuCuTriCallData
            ]);
            
            // Lấy timestamp hiện tại
            const blockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
            
            // Chuẩn bị paymasterAndData
            const themCuTriDeadlineTime = Number(blockTimestamp) + 3600; // 1 giờ sau
            const themCuTriValidationTime = Number(blockTimestamp);
            
            const themCuTriPaymasterAndData = ethers.concat([
                paymasterAddress,
                ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [themCuTriDeadlineTime]),
                ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [themCuTriValidationTime])
            ]);
            
            // Chuẩn bị UserOperation với gas limit cao hơn cho batch lớn
            const themCuTriUserOp = {
                sender: scwAddress,
                nonce: currentNonce,
                initCode: "0x",
                callData: executeThemNhieuCuTriCallData,
                callGasLimit: 5000000n, // Tăng gas limit cho 100 cử tri
                verificationGasLimit: 3000000n,
                preVerificationGas: 500000n,
                maxFeePerGas: ethers.parseUnits("5", "gwei"),
                maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
                paymasterAndData: themCuTriPaymasterAndData,
                signature: "0x"
            };
            
            // Ký UserOperation
            const themCuTriUserOpHash = await entryPoint.layHashThaoTac(themCuTriUserOp);
            const themCuTriSignature = signingKey.sign(themCuTriUserOpHash);
            
            themCuTriUserOp.signature = themCuTriSignature.serialized;
            
            console.log("Gửi UserOperation để thêm nhiều cử tri...");
            console.log("Kích thước batch:", batch.length);
            
            const tx = await entryPoint.xuLyCacThaoTac(
                [themCuTriUserOp],
                deployer.address,
                { 
                    gasLimit: 8000000n, // Tăng gas limit cho giao dịch lớn
                }
            );
            
            console.log("Giao dịch đã gửi:", tx.hash);
            const receipt = await tx.wait();
            console.log("Trạng thái giao dịch:", receipt?.status === 1 ? "✅ THÀNH CÔNG" : "❌ THẤT BẠI");
            console.log("Gas đã sử dụng:", receipt.gasUsed.toString());
            
            // Đợi 3 giây để blockchain cập nhật
            console.log("Đợi 3 giây để blockchain cập nhật...");
            await new Promise(resolve => setTimeout(resolve, 3000));
            
        } catch (error) {
            console.log(`❌ Lỗi khi thêm nhóm cử tri ${batchIndex + 1}:`, error.message);
            if (error.data) {
                console.log("Error data:", error.data);
            }
            
            // Nếu gặp lỗi, thử giảm kích thước batch xuống một nửa
            if (batch.length > 10) {
                console.log("Thử lại với batch nhỏ hơn...");
                const smallerBatchSize = Math.floor(batch.length / 2);
                const smallerBatches = [];
                
                for (let i = 0; i < batch.length; i += smallerBatchSize) {
                    smallerBatches.push(batch.slice(i, i + smallerBatchSize));
                }
                
                for (let i = 0; i < smallerBatches.length; i++) {
                    const smallBatch = smallerBatches[i];
                    console.log(`Thử lại với batch nhỏ hơn ${i+1}/${smallerBatches.length} (${smallBatch.length} cử tri)...`);
                    
                    try {
                        // Lấy nonce hiện tại
                        let retryNonce = await entryPoint.getNonce(scwAddress);
                        
                        // Chuẩn bị callData để thêm nhiều cử tri
                        const retryCallData = quanLyCuocBauCu.interface.encodeFunctionData("themNhieuCuTri", [
                            1n, 
                            phienBauCuId,
                            smallBatch
                        ]);
                        
                        const retryExecuteCallData = simpleAccount.interface.encodeFunctionData("execute", [
                            quanLyCuocBauCuAddress, 
                            0, 
                            retryCallData
                        ]);
                        
                        // Lấy timestamp hiện tại
                        const retryTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
                        
                        // Chuẩn bị paymasterAndData
                        const retryDeadlineTime = Number(retryTimestamp) + 3600;
                        const retryValidationTime = Number(retryTimestamp);
                        
                        const retryPaymasterAndData = ethers.concat([
                            paymasterAddress,
                            ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [retryDeadlineTime]),
                            ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [retryValidationTime])
                        ]);
                        
                        // Chuẩn bị UserOperation
                        const retryUserOp = {
                            sender: scwAddress,
                            nonce: retryNonce,
                            initCode: "0x",
                            callData: retryExecuteCallData,
                            callGasLimit: 3000000n,
                            verificationGasLimit: 2000000n,
                            preVerificationGas: 300000n,
                            maxFeePerGas: ethers.parseUnits("5", "gwei"),
                            maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
                            paymasterAndData: retryPaymasterAndData,
                            signature: "0x"
                        };
                        
                        // Ký UserOperation
                        const retryUserOpHash = await entryPoint.layHashThaoTac(retryUserOp);
                        const retrySignature = signingKey.sign(retryUserOpHash);
                        
                        retryUserOp.signature = retrySignature.serialized;
                        
                        const retryTx = await entryPoint.xuLyCacThaoTac(
                            [retryUserOp],
                            deployer.address,
                            { 
                                gasLimit: 5000000n, 
                            }
                        );
                        
                        console.log("Giao dịch đã gửi:", retryTx.hash);
                        const retryReceipt = await retryTx.wait();
                        console.log("Trạng thái giao dịch:", retryReceipt?.status === 1 ? "✅ THÀNH CÔNG" : "❌ THẤT BẠI");
                        
                        // Đợi 3 giây để blockchain cập nhật
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        
                    } catch (retryError) {
                        console.log(`❌ Lỗi khi thử lại với batch nhỏ hơn:`, retryError.message);
                    }
                }
            }
        }
    }
    
    // Kiểm tra số cử tri đã được thêm vào
    try {
        const phienInfoAfter = await quanLyCuocBauCu.layThongTinPhienBauCu(1n, phienBauCuId);
        const soCuTriSauKhiThem = Number(phienInfoAfter[5]);
        console.log(`Số cử tri sau khi thêm: ${soCuTriSauKhiThem} (tăng ${soCuTriSauKhiThem - soCuTriHienTai} cử tri)`);
    } catch (error) {
        console.log("Không thể kiểm tra số cử tri sau khi thêm:", error.message);
    }
    
    console.log("Đã hoàn tất việc thêm cử tri!");
}

/**
 * Thêm nhiều ứng viên vào phiên bầu cử cùng một lúc
 */
async function themNhieuUngVien(
    ungVienList,
    phienBauCuId,
    quanLyCuocBauCu,
    quanLyCuocBauCuAddress,
    scwAddress,
    entryPoint,
    signingKey,
    currentTimestamp,
    paymasterAddress,
    deployer,
    hluToken,          // Thêm tham số hluToken
    hluTokenAddress    // Thêm tham số hluTokenAddress
) {
    console.log(`Đang thêm ${ungVienList.length} ứng viên vào phiên bầu cử cùng một lúc...`);
    
    // Kết nối tới simpleAccount
    const simpleAccount = await ethers.getContractAt("SimpleAccountNe", scwAddress);
    
    // Kiểm tra danh sách ứng viên hiện tại
    const danhSachUngVien = await quanLyCuocBauCu.layDanhSachUngVien(1n, phienBauCuId);
    console.log("Ứng viên hiện tại:", danhSachUngVien);
    
    // Lọc ra các ứng viên chưa được thêm
    const existingCandidates = [];
    const newCandidates = [];
    
    for (const ungVien of ungVienList) {
        const daLaUngVien = danhSachUngVien.some(addr => addr.toLowerCase() === ungVien.toLowerCase());
        if (daLaUngVien) {
            existingCandidates.push(ungVien);
        } else {
            // Kiểm tra xem ứng viên đã là cử tri chưa
            const laCuTri = await quanLyCuocBauCu.laCuTri(1n, phienBauCuId, ungVien);
            if (laCuTri) {
                newCandidates.push(ungVien);
            } else {
                console.log(`Ứng viên ${ungVien} không phải là cử tri, không thể thêm`);
            }
        }
    }
    
    console.log(`Có ${existingCandidates.length} ứng viên đã tồn tại trong phiên bầu cử.`);
    console.log(`Sẽ thêm ${newCandidates.length} ứng viên mới vào phiên bầu cử.`);
    
    if (newCandidates.length === 0) {
        console.log("Không có ứng viên mới để thêm, bỏ qua bước này.");
        return;
    }
    
    // Chia danh sách ứng viên thành các nhóm nhỏ hơn để tránh lỗi gas limit
    // Mỗi nhóm tối đa 5 ứng viên
    const BATCH_SIZE = 5;
    const batches = [];
    
    for (let i = 0; i < newCandidates.length; i += BATCH_SIZE) {
        batches.push(newCandidates.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`Chia thành ${batches.length} nhóm để thêm ứng viên.`);
    
    // Thêm từng nhóm ứng viên
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`Đang xử lý nhóm ${batchIndex + 1}/${batches.length} với ${batch.length} ứng viên`);
        
        try {
            // Lấy nonce hiện tại
            let currentNonce = await entryPoint.getNonce(scwAddress);
            console.log("Nonce hiện tại:", currentNonce.toString());
            
            // Tính phí HLU cần thiết cho việc thêm nhiều ứng viên
            const PHI_THEM_UNG_VIEN = ethers.parseEther("1"); // 1 HLU per candidate
            const phiTong = PHI_THEM_UNG_VIEN * BigInt(batch.length);
            
            // Kiểm tra allowance cho hợp đồng QuanLyCuocBauCu
            const allowance = await hluToken.allowance(scwAddress, quanLyCuocBauCuAddress);
            console.log("HLU allowance hiện tại:", ethers.formatEther(allowance));
            
            if (allowance < phiTong) {
                console.log("Allowance không đủ, cần approve thêm HLU...");
                await approveHLUToken(
                    hluToken,
                    hluTokenAddress,
                    quanLyCuocBauCuAddress,
                    simpleAccount,
                    scwAddress,
                    entryPoint,
                    signingKey,
                    deployer
                );
                
                // Lấy lại nonce sau khi approve
                currentNonce = await entryPoint.getNonce(scwAddress);
            }
            
            // Chuẩn bị callData để thêm nhiều ứng viên
            const themNhieuUngVienCallData = quanLyCuocBauCu.interface.encodeFunctionData("themNhieuUngVien", [
                1n, // ID cuộc bầu cử trong QuanLyCuocBauCu là 1
                phienBauCuId,
                batch
            ]);
            
            const executeThemNhieuUngVienCallData = simpleAccount.interface.encodeFunctionData("execute", [
                quanLyCuocBauCuAddress, 
                0, 
                themNhieuUngVienCallData
            ]);
            
            // Lấy timestamp hiện tại
            const blockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
            
            // Chuẩn bị paymasterAndData
            const themUngVienDeadlineTime = Number(blockTimestamp) + 3600; // 1 giờ sau
            const themUngVienValidationTime = Number(blockTimestamp);
            
            const themUngVienPaymasterAndData = ethers.concat([
                paymasterAddress,
                ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [themUngVienDeadlineTime]),
                ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [themUngVienValidationTime])
            ]);
            
            // Chuẩn bị UserOperation
            const themUngVienUserOp = {
                sender: scwAddress,
                nonce: currentNonce,
                initCode: "0x",
                callData: executeThemNhieuUngVienCallData,
                callGasLimit: 1000000n, // Tăng gas limit vì xử lý nhiều ứng viên
                verificationGasLimit: 1000000n,
                preVerificationGas: 300000n,
                maxFeePerGas: ethers.parseUnits("5", "gwei"),
                maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
                paymasterAndData: themUngVienPaymasterAndData,
                signature: "0x"
            };
            
            // Ký UserOperation
            const themUngVienUserOpHash = await entryPoint.layHashThaoTac(themUngVienUserOp);
            const themUngVienSignature = signingKey.sign(themUngVienUserOpHash);
            
            themUngVienUserOp.signature = themUngVienSignature.serialized;
            
            const tx = await entryPoint.xuLyCacThaoTac(
                [themUngVienUserOp],
                deployer.address,
                { 
                    gasLimit: 5000000n, // Tăng gas limit
                }
            );
            
            console.log("Giao dịch đã gửi:", tx.hash);
            const receipt = await tx.wait();
            console.log("Trạng thái giao dịch:", receipt?.status === 1 ? "✅ THÀNH CÔNG" : "❌ THẤT BẠI");
            console.log("Gas đã sử dụng:", receipt.gasUsed.toString());
            
            // Đợi 2 giây để blockchain cập nhật
            console.log("Đợi 2 giây để blockchain cập nhật...");
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.log(`❌ Lỗi khi thêm nhóm ứng viên ${batchIndex + 1}:`, error.message);
            if (error.data) {
                console.log("Error data:", error.data);
            }
        }
    }
    
    console.log("Đã hoàn tất việc thêm ứng viên!");
}

/**
 * Cấp phiếu bầu cho nhiều cử tri cùng một lúc
 */
async function capPhieuBauChoNhieuCuTri(
    cuTriList,
    phienBauCuId,
    quanLyCuocBauCu,
    quanLyCuocBauCuAddress,
    quanLyPhieuBau,
    scwAddress,
    entryPoint,
    signingKey,
    currentTimestamp,
    paymasterAddress,
    deployer,
    newAccount
) {
    console.log("\n=== CẤP PHIẾU BẦU CHO NHIỀU CỬ TRI ===");
    console.log(`Tổng số ${cuTriList.length} cử tri cần cấp phiếu`);
    
    // Kết nối tới simpleAccount
    const simpleAccount = await ethers.getContractAt("SimpleAccountNe", scwAddress);
    
    // Kiểm tra cử tri đã nhận phiếu
    console.log("Đang kiểm tra cử tri đã nhận phiếu...");
    const cuTriChuaNhanPhieu = [];
    
    for (let i = 0; i < cuTriList.length; i++) {
        if (i % 20 === 0) {
            console.log(`Đã kiểm tra ${i}/${cuTriList.length} cử tri...`);
        }
        
        try {
            const daNhanPhieu = await quanLyPhieuBau.daNhanNFT(quanLyCuocBauCuAddress, phienBauCuId, cuTriList[i]);
            if (!daNhanPhieu) {
                // Kiểm tra cử tri có trong phiên bầu cử không
                const laCuTri = await quanLyCuocBauCu.laCuTri(1n, phienBauCuId, cuTriList[i]);
                if (laCuTri) {
                    cuTriChuaNhanPhieu.push(cuTriList[i]);
                }
            }
        } catch (error) {
            console.log(`Lỗi kiểm tra cử tri ${cuTriList[i]}:`, error.message);
        }
    }
    
    console.log(`Có ${cuTriChuaNhanPhieu.length} cử tri chưa nhận phiếu, tiến hành cấp phiếu...`);
    
    if (cuTriChuaNhanPhieu.length === 0) {
        console.log("Không có cử tri nào cần cấp phiếu, bỏ qua bước này!");
        return;
    }
    
    // Phân chia cử tri thành các batch để cấp phiếu
    // Mỗi batch tối đa 20 cử tri
    const BATCH_SIZE = 20;
    const batches = [];
    
    for (let i = 0; i < cuTriChuaNhanPhieu.length; i += BATCH_SIZE) {
        batches.push(cuTriChuaNhanPhieu.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`Chia thành ${batches.length} nhóm để cấp phiếu bầu.`);
    
    // Cấp phiếu cho từng nhóm cử tri
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`Đang xử lý nhóm ${batchIndex + 1}/${batches.length} với ${batch.length} cử tri`);
        
        try {
            // Tạo tokenURIs cho từng cử tri
            const tokenURIs = batch.map((address, i) => 
                `ipfs://QmVoteTicket${Date.now().toString()}_${i}_${address.substring(0, 8)}`
            );
            
            // Lấy nonce hiện tại
            let currentNonce = await entryPoint.getNonce(scwAddress);
            console.log("Nonce hiện tại:", currentNonce.toString());
            
            // Chuẩn bị callData để cấp phiếu bầu cho nhiều cử tri
            const capPhieuBauCallData = quanLyCuocBauCu.interface.encodeFunctionData("capPhieuBauChoNhieuCuTri", [
                1n, // ID cuộc bầu cử trong QuanLyCuocBauCu là 1
                phienBauCuId,
                batch,
                tokenURIs
            ]);
            
            const executeCapPhieuBauCallData = simpleAccount.interface.encodeFunctionData("execute", [
                quanLyCuocBauCuAddress, 
                0, 
                capPhieuBauCallData
            ]);
            
            // Lấy timestamp hiện tại
            const blockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
            
            // Chuẩn bị paymasterAndData
            const deadlineTime = Number(blockTimestamp) + 3600; // 1 giờ sau
            const validationTime = Number(blockTimestamp);
            
            const paymasterAndData = ethers.concat([
                paymasterAddress,
                ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [deadlineTime]),
                ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [validationTime])
            ]);
            
            // Chuẩn bị UserOperation
            const userOp = {
                sender: scwAddress,
                nonce: currentNonce,
                initCode: "0x",
                callData: executeCapPhieuBauCallData,
                callGasLimit: 3000000n, // Tăng gas limit cho nhiều cử tri
                verificationGasLimit: 3000000n,
                preVerificationGas: 500000n,
                maxFeePerGas: ethers.parseUnits("5", "gwei"),
                maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
                paymasterAndData: paymasterAndData,
                signature: "0x"
            };
            
            // Ký UserOperation
            const userOpHash = await entryPoint.layHashThaoTac(userOp);
            const signature = signingKey.sign(userOpHash);
            userOp.signature = signature.serialized;
            
            console.log("Gửi UserOperation để cấp phiếu bầu cho nhiều cử tri...");
            console.log("Kích thước batch:", batch.length);
            
            const tx = await entryPoint.xuLyCacThaoTac(
                [userOp],
                newAccount.address, // Sử dụng tài khoản mới để tránh lỗi admin proxy
                { 
                    gasLimit: 8000000n, // Tăng gas limit
                }
            );
            
            console.log("Giao dịch đã gửi:", tx.hash);
            const receipt = await tx.wait();
            console.log("Trạng thái giao dịch:", receipt?.status === 1 ? "✅ THÀNH CÔNG" : "❌ THẤT BẠI");
            console.log("Gas đã sử dụng:", receipt.gasUsed.toString());
            
            // Đợi 3 giây để blockchain cập nhật
            console.log("Đợi 3 giây để blockchain cập nhật...");
            await new Promise(resolve => setTimeout(resolve, 3000));
            
        } catch (error) {
            console.log(`❌ Lỗi khi cấp phiếu bầu cho nhóm ${batchIndex + 1}:`, error.message);
            if (error.data) {
                console.log("Error data:", error.data);
            }
            
            // Nếu gặp lỗi với batch lớn, thử với batch nhỏ hơn
            if (batch.length > 5 && error.message.includes("gas")) {
                console.log("Thử lại với batch nhỏ hơn...");
                // Chia thành batch nhỏ hơn
                const smallerBatches = [];
                for (let i = 0; i < batch.length; i += 5) {
                    smallerBatches.push(batch.slice(i, i + 5));
                }
                
                for (let j = 0; j < smallerBatches.length; j++) {
                    const smallBatch = smallerBatches[j];
                    console.log(`Thử lại với batch nhỏ ${j+1}/${smallerBatches.length} (${smallBatch.length} cử tri)...`);
                    
                    try {
                        // Tạo tokenURIs mới
                        const smallTokenURIs = smallBatch.map((address, i) => 
                            `ipfs://QmVoteTicket${Date.now().toString()}_${i}_${address.substring(0, 8)}`
                        );
                        
                        // Lấy nonce hiện tại
                        let retryNonce = await entryPoint.getNonce(scwAddress);
                        
                        // Chuẩn bị callData để cấp phiếu bầu
                        const retryCallData = quanLyCuocBauCu.interface.encodeFunctionData("capPhieuBauChoNhieuCuTri", [
                            1n,
                            phienBauCuId,
                            smallBatch,
                            smallTokenURIs
                        ]);
                        
                        const retryExecuteCallData = simpleAccount.interface.encodeFunctionData("execute", [
                            quanLyCuocBauCuAddress, 
                            0, 
                            retryCallData
                        ]);
                        
                        // Lấy timestamp hiện tại
                        const retryTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
                        
                        // Chuẩn bị paymasterAndData
                        const retryDeadlineTime = Number(retryTimestamp) + 3600;
                        const retryValidationTime = Number(retryTimestamp);
                        
                        const retryPaymasterAndData = ethers.concat([
                            paymasterAddress,
                            ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [retryDeadlineTime]),
                            ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [retryValidationTime])
                        ]);
                        
                        // Chuẩn bị UserOperation
                        const retryUserOp = {
                            sender: scwAddress,
                            nonce: retryNonce,
                            initCode: "0x",
                            callData: retryExecuteCallData,
                            callGasLimit: 2000000n,
                            verificationGasLimit: 2000000n,
                            preVerificationGas: 300000n,
                            maxFeePerGas: ethers.parseUnits("5", "gwei"),
                            maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
                            paymasterAndData: retryPaymasterAndData,
                            signature: "0x"
                        };
                        
                        // Ký UserOperation
                        const retryUserOpHash = await entryPoint.layHashThaoTac(retryUserOp);
                        const retrySignature = signingKey.sign(retryUserOpHash);
                        
                        retryUserOp.signature = retrySignature.serialized;
                        
                        const retryTx = await entryPoint.xuLyCacThaoTac(
                            [retryUserOp],
                            newAccount.address,
                            { 
                                gasLimit: 4000000n, 
                            }
                        );
                        
                        console.log("Giao dịch đã gửi:", retryTx.hash);
                        const retryReceipt = await retryTx.wait();
                        console.log("Trạng thái giao dịch:", retryReceipt?.status === 1 ? "✅ THÀNH CÔNG" : "❌ THẤT BẠI");
                        
                        // Đợi 2 giây để blockchain cập nhật
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                    } catch (retryError) {
                        console.log(`❌ Lỗi khi thử lại với batch nhỏ hơn:`, retryError.message);
                    }
                }
            }
        }
    }
    
    // Kiểm tra kết quả sau khi cấp phiếu
    let soPhieuDaCap = 0;
    for (const cuTri of cuTriChuaNhanPhieu) {
        try {
            const daNhanPhieu = await quanLyPhieuBau.daNhanNFT(quanLyCuocBauCuAddress, phienBauCuId, cuTri);
            if (daNhanPhieu) {
                soPhieuDaCap++;
                console.log(`Cử tri ${cuTri} đã nhận phiếu bầu: ✅`);
            } else {
                console.log(`Cử tri ${cuTri} chưa nhận phiếu bầu: ❌`);
            }
        } catch (error) {
            // Bỏ qua lỗi kiểm tra
        }
    }
    
    console.log(`\nĐã cấp thành công ${soPhieuDaCap}/${cuTriChuaNhanPhieu.length} phiếu bầu.`);
}

/**
 * Bỏ phiếu cho ứng viên
 */
async function boPhieuChoUngVien(
    cuTriAccounts,  // Danh sách tài khoản cử tri có private key
    ungVien,        // Địa chỉ ứng viên được bầu
    serverId,       // ID server trong Factory
    phienBauCuId,   // ID phiên bầu cử
    quanLyCuocBauCu,// Kết nối đến contract QuanLyCuocBauCu
    quanLyPhieuBau, // Kết nối đến contract QuanLyPhieuBauToanCuc
    hluToken,       // Kết nối đến token HLU
    quanLyPhieuBauAddress, // Địa chỉ của contract QuanLyPhieuBauToanCuc
    deployer        // Tài khoản deployer
) {
    console.log(`Đang tiến hành bỏ phiếu cho ứng viên ${ungVien}...`);
    
    // Lấy số lượng phiếu bầu hiện có của ứng viên để so sánh sau
    const soPhieuBanDau = await quanLyCuocBauCu.laySoPhieuUngVien(1n, phienBauCuId, ungVien);
    console.log(`Số phiếu hiện tại của ứng viên ${ungVien}: ${soPhieuBanDau.toString()}`);
    
    const PHI_BO_PHIEU = ethers.parseEther("5"); // 3 HLU theo QuanLyPhieuBauToanCuc.sol
    
    // Bỏ phiếu từng cử tri một
    for (let i = 0; i < cuTriAccounts.length; i++) {
        const cuTri = cuTriAccounts[i];
        console.log(`\nXử lý cử tri ${i+1}/${cuTriAccounts.length}: ${cuTri.address}`);
        
        try {
            // Tạo signer từ private key của cử tri
            const cuTriSigner = new ethers.Wallet(cuTri.privateKey, ethers.provider);
            
            // Kiểm tra xem cử tri đã bỏ phiếu chưa
            const daBoPhieu = await quanLyPhieuBau.daBoPhieu(serverId, phienBauCuId, cuTri.address);
            if (daBoPhieu) {
                console.log(`Cử tri ${cuTri.address} đã bỏ phiếu, bỏ qua...`);
                continue;
            }
            
            // Tìm NFT token ID mà cử tri đang sở hữu
            const danhSachToken = await quanLyPhieuBau.layDanhSachTokenCuaPhien(phienBauCuId);
            console.log(`Phiên có ${danhSachToken.length} NFT phiếu bầu`);
            
            // Tìm token của cử tri
            let tokenId = null;
            for (const token of danhSachToken) {
                try {
                    const chuSoHuu = await quanLyPhieuBau.ownerOf(token);
                    if (chuSoHuu.toLowerCase() === cuTri.address.toLowerCase()) {
                        tokenId = token;
                        break;
                    }
                } catch (e) {
                    // Token có thể đã bị burn hoặc không tồn tại
                    continue;
                }
            }
            
            if (!tokenId) {
                console.log(`Không tìm thấy NFT phiếu bầu cho cử tri ${cuTri.address}`);
                continue;
            }
            
            console.log(`Tìm thấy NFT phiếu bầu ID: ${tokenId} cho cử tri ${cuTri.address}`);
            
            // Kiểm tra quyền bầu cử
            const quyenBauCu = await quanLyPhieuBau.kiemTraQuyenBauCu(
                cuTri.address, 
                serverId, 
                phienBauCuId, 
                tokenId
            );
            
            if (!quyenBauCu) {
                console.log(`Cử tri ${cuTri.address} không có quyền bầu cử với token ${tokenId}`);
                
                // Kiểm tra chi tiết hơn
                const quyenBauCuChiTiet = await quanLyPhieuBau.kiemTraQuyenBauCuChiTiet(
                    cuTri.address, 
                    serverId, 
                    phienBauCuId, 
                    tokenId
                );
                
                console.log("Chi tiết quyền bầu cử:");
                console.log("- Token tồn tại:", quyenBauCuChiTiet[0]);
                console.log("- Đã bỏ phiếu:", quyenBauCuChiTiet[1]);
                console.log("- Là người sở hữu token:", quyenBauCuChiTiet[2]);
                console.log("- Phiên hợp lệ:", quyenBauCuChiTiet[3]);
                console.log("- Trong thời gian bầu cử:", quyenBauCuChiTiet[4]);
                
                continue;
            }
            
            // Kiểm tra và approve HLU token nếu cần
            const allowance = await hluToken.connect(cuTriSigner).allowance(cuTri.address, quanLyPhieuBauAddress);
            console.log(`Allowance hiện tại của cử tri cho QuanLyPhieuBau: ${ethers.formatEther(allowance)} HLU`);
            
            if (allowance < PHI_BO_PHIEU) {
                console.log(`Approve ${ethers.formatEther(PHI_BO_PHIEU)} HLU cho QuanLyPhieuBau...`);
                const approveTx = await hluToken.connect(cuTriSigner).approve(quanLyPhieuBauAddress, PHI_BO_PHIEU);
                await approveTx.wait();
                console.log("Approve thành công!");
            }
            
            // Thực hiện bỏ phiếu
            console.log(`Cử tri ${cuTri.address} đang bỏ phiếu cho ứng viên ${ungVien}...`);
            const boPhieuTx = await quanLyPhieuBau.connect(cuTriSigner).boPhieu(
                tokenId,
                serverId,
                phienBauCuId,
                ungVien
            );
            
            console.log("Giao dịch bỏ phiếu đã gửi:", boPhieuTx.hash);
            const receipt = await boPhieuTx.wait();
            console.log("Trạng thái giao dịch:", receipt?.status === 1 ? "✅ THÀNH CÔNG" : "❌ THẤT BẠI");
            
            // Đợi 2 giây để blockchain cập nhật
            console.log("Đợi 2 giây để blockchain cập nhật...");
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.log(`❌ Lỗi khi bỏ phiếu của cử tri ${cuTri.address}:`, error.message);
            if (error.data) {
                console.log("Error data:", error.data);
            }
        }
    }
    
    // Kiểm tra kết quả sau khi bỏ phiếu
    const soPhieuSau = await quanLyCuocBauCu.laySoPhieuUngVien(1n, phienBauCuId, ungVien);
    console.log(`\nKết quả bỏ phiếu cho ứng viên ${ungVien}:`);
    console.log(`- Số phiếu ban đầu: ${soPhieuBanDau.toString()}`);
    console.log(`- Số phiếu sau khi bỏ phiếu: ${soPhieuSau.toString()}`);
    console.log(`- Tăng: ${(soPhieuSau - soPhieuBanDau).toString()} phiếu`);
}

/**
 * Bắt đầu phiên bầu cử
 */
async function batDauPhienBauCu(
    phienBauCuId,
    quanLyCuocBauCu,
    quanLyCuocBauCuAddress,
    scwAddress,
    entryPoint,
    signingKey,
    currentTimestamp,
    paymasterAddress,
    deployer
) {
    console.log("Đang bắt đầu phiên bầu cử...");
    
    // Lấy nonce hiện tại
    let currentNonce = await entryPoint.getNonce(scwAddress);
    console.log("Nonce hiện tại:", currentNonce.toString());
    
    // Kết nối tới simpleAccount
    const simpleAccount = await ethers.getContractAt("SimpleAccountNe", scwAddress);
    
    const thoiGianKeoDaiPhien = 3n * 24n * 60n * 60n; // 3 ngày
    
    // Chuẩn bị callData để bắt đầu phiên bầu cử
    const batDauPhienCallData = quanLyCuocBauCu.interface.encodeFunctionData("batDauPhienBauCu", [
        1n, // ID cuộc bầu cử
        phienBauCuId,
        thoiGianKeoDaiPhien
    ]);
    
    const executeBatDauPhienCallData = simpleAccount.interface.encodeFunctionData("execute", [
        quanLyCuocBauCuAddress, 
        0, 
        batDauPhienCallData
    ]);
    
    // Chuẩn bị paymasterAndData
    const batDauPhienDeadlineTime = Number(currentTimestamp) + 3600; // 1 giờ sau
    const batDauPhienValidationTime = Number(currentTimestamp);
    
    const batDauPhienPaymasterAndData = ethers.concat([
        paymasterAddress,
        ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [batDauPhienDeadlineTime]),
        ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [batDauPhienValidationTime])
    ]);
    
    // Chuẩn bị UserOperation
    const batDauPhienUserOp = {
        sender: scwAddress,
        nonce: currentNonce,
        initCode: "0x",
        callData: executeBatDauPhienCallData,
        callGasLimit: 500000n,
        verificationGasLimit: 500000n,
        preVerificationGas: 100000n,
        maxFeePerGas: ethers.parseUnits("5", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
        paymasterAndData: batDauPhienPaymasterAndData,
        signature: "0x"
    };
    
    // Ký UserOperation
    const batDauPhienUserOpHash = await entryPoint.layHashThaoTac(batDauPhienUserOp);
    const batDauPhienSignature = signingKey.sign(batDauPhienUserOpHash);
    
    batDauPhienUserOp.signature = batDauPhienSignature.serialized;
    
    try {
        const tx = await entryPoint.xuLyCacThaoTac(
            [batDauPhienUserOp],
            deployer.address,
            { 
                gasLimit: 3000000n,
            }
        );
        
        console.log("Giao dịch đã gửi:", tx.hash);
        const receipt = await tx.wait();
        console.log("Trạng thái giao dịch:", receipt?.status === 1 ? "✅ THÀNH CÔNG" : "❌ THẤT BẠI");
        
        // Đợi 2 giây để blockchain cập nhật
        console.log("Đợi 2 giây để blockchain cập nhật...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Kiểm tra trạng thái phiên bầu cử
        const isSessionActive = await quanLyCuocBauCu.laPhienHoatDong(1n, phienBauCuId);
        console.log("Trạng thái phiên bầu cử:", isSessionActive ? "Đang hoạt động" : "Chưa hoạt động");
        
        return isSessionActive;
    } catch (error) {
        console.log(`❌ Lỗi khi bắt đầu phiên bầu cử:`, error.message);
        if (error.data) {
            console.log("Error data:", error.data);
        }
        return false;
    }
}



// Thực thi script
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error("❌ Lỗi không mong đợi:", error);
        process.exit(1);
    });
