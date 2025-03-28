// Tách các mẫu điều lệ thành một file riêng để dễ quản lý

export const mauDieuLe = {
  coBan: `<h1>ĐIỀU LỆ BẦU CỬ</h1>
<h2>I. NGUYÊN TẮC CHUNG</h2>
<p>Cuộc bầu cử được tổ chức dựa trên các nguyên tắc công bằng, minh bạch và dân chủ.</p>
<p>Mỗi cử tri được bầu tối đa 5 ứng viên trong danh sách.</p>
<p>Kết quả bầu cử sẽ được công bố sau khi kết thúc thời gian bỏ phiếu và được xác nhận bởi Ban tổ chức.</p>

<h2>II. ỨNG CỬ VIÊN</h2>
<p>Ứng cử viên phải đáp ứng đầy đủ các tiêu chuẩn theo quy định.</p>
<p>Ứng cử viên có quyền vận động bầu cử theo quy định của Ban tổ chức.</p>
<p>Ứng cử viên không được có hành vi gian lận, mua chuộc phiếu bầu.</p>

<h2>III. CỬ TRI</h2>
<p>Cử tri phải là thành viên chính thức của tổ chức.</p>
<p>Mỗi cử tri chỉ được bỏ phiếu một lần trong mỗi phiên bầu cử.</p>
<p>Cử tri có quyền được thông tin đầy đủ về các ứng cử viên và quy trình bầu cử.</p>

<h2>IV. QUY TRÌNH BỎ PHIẾU</h2>
<p>Cử tri phải xác thực danh tính trước khi bỏ phiếu.</p>
<p>Việc bỏ phiếu được thực hiện trên hệ thống blockchain đảm bảo tính bảo mật và minh bạch.</p>
<p>Phiếu bầu sau khi đã xác nhận không thể thay đổi hoặc hủy bỏ.</p>`,

  nangCao: `<h1>ĐIỀU LỆ BẦU CỬ CHI TIẾT</h1>
<h2>I. NGUYÊN TẮC CHUNG</h2>
<p>Cuộc bầu cử được tổ chức dựa trên các nguyên tắc công bằng, minh bạch và dân chủ, đảm bảo quyền lợi của mọi thành viên tham gia.</p>
<p>Mỗi cử tri được bầu tối đa 5 ứng viên trong danh sách, với số phiếu bầu được phân bổ theo quy định cụ thể của từng vị trí.</p>
<p>Kết quả bầu cử sẽ được công bố sau khi kết thúc thời gian bỏ phiếu và được xác nhận bởi Ban tổ chức, đồng thời được lưu trữ trên blockchain để đảm bảo tính minh bạch và không thể thay đổi.</p>

<h2>II. ỨNG CỬ VIÊN</h2>
<h3>2.1. Tiêu chuẩn ứng cử viên</h3>
<p>Ứng cử viên phải đáp ứng đầy đủ các tiêu chuẩn sau:</p>
<ul>
  <li>Là thành viên chính thức của tổ chức ít nhất 6 tháng</li>
  <li>Có đầy đủ năng lực hành vi dân sự</li>
  <li>Không đang trong thời gian bị kỷ luật</li>
  <li>Có kinh nghiệm phù hợp với vị trí ứng cử</li>
</ul>

<h3>2.2. Quyền và nghĩa vụ của ứng cử viên</h3>
<p>Ứng cử viên có quyền vận động bầu cử theo quy định của Ban tổ chức, bao gồm:</p>
<ul>
  <li>Giới thiệu bản thân và chương trình hành động</li>
  <li>Tham gia các buổi đối thoại, thảo luận</li>
  <li>Nhận thông tin đầy đủ về quy trình bầu cử</li>
</ul>
<p>Ứng cử viên không được có hành vi gian lận, mua chuộc phiếu bầu hoặc các hành vi vi phạm quy định bầu cử khác.</p>

<h2>III. CỬ TRI</h2>
<h3>3.1. Điều kiện tham gia bỏ phiếu</h3>
<p>Cử tri phải là thành viên chính thức của tổ chức và đáp ứng các điều kiện sau:</p>
<ul>
  <li>Đã hoàn thành đăng ký và xác thực thông tin</li>
  <li>Không đang trong thời gian bị tước quyền bầu cử</li>
  <li>Đã đọc và đồng ý với điều lệ bầu cử</li>
</ul>

<h3>3.2. Quyền và nghĩa vụ của cử tri</h3>
<p>Mỗi cử tri chỉ được bỏ phiếu một lần trong mỗi phiên bầu cử.</p>
<p>Cử tri có quyền được thông tin đầy đủ về các ứng cử viên và quy trình bầu cử.</p>
<p>Cử tri có nghĩa vụ tuân thủ các quy định bầu cử và giữ bí mật thông tin bỏ phiếu của mình.</p>

<h2>IV. QUY TRÌNH BỎ PHIẾU</h2>
<h3>4.1. Xác thực danh tính</h3>
<p>Cử tri phải xác thực danh tính trước khi bỏ phiếu thông qua một trong các phương thức sau:</p>
<ul>
  <li>Đăng nhập bằng tài khoản đã xác thực</li>
  <li>Xác thực qua email hoặc số điện thoại</li>
  <li>Sử dụng ví điện tử đã đăng ký</li>
</ul>

<h3>4.2. Bỏ phiếu trên blockchain</h3>
<p>Việc bỏ phiếu được thực hiện trên hệ thống blockchain đảm bảo tính bảo mật và minh bạch với các đặc điểm:</p>
<ul>
  <li>Mỗi phiếu bầu được mã hóa và lưu trữ an toàn</li>
  <li>Cử tri có thể xác minh phiếu bầu của mình đã được ghi nhận</li>
  <li>Hệ thống đảm bảo tính ẩn danh của người bỏ phiếu</li>
</ul>
<p>Phiếu bầu sau khi đã xác nhận không thể thay đổi hoặc hủy bỏ.</p>

<h2>V. KIỂM PHIẾU VÀ CÔNG BỐ KẾT QUẢ</h2>
<h3>5.1. Quy trình kiểm phiếu</h3>
<p>Việc kiểm phiếu được thực hiện tự động trên hệ thống blockchain ngay sau khi kết thúc thời gian bỏ phiếu.</p>
<p>Ban tổ chức sẽ giám sát quá trình kiểm phiếu và xác nhận kết quả.</p>

<h3>5.2. Công bố kết quả</h3>
<p>Kết quả bầu cử sẽ được công bố trong vòng 24 giờ sau khi kết thúc thời gian bỏ phiếu.</p>
<p>Kết quả bầu cử bao gồm:</p>
<ul>
  <li>Danh sách ứng cử viên trúng cử</li>
  <li>Số phiếu bầu cho từng ứng cử viên</li>
  <li>Tỷ lệ cử tri tham gia bỏ phiếu</li>
</ul>

<h2>VI. GIẢI QUYẾT KHIẾU NẠI</h2>
<p>Cử tri và ứng cử viên có quyền khiếu nại về kết quả bầu cử trong vòng 48 giờ sau khi công bố kết quả.</p>
<p>Ban tổ chức sẽ xem xét và giải quyết khiếu nại trong vòng 72 giờ kể từ khi nhận được khiếu nại.</p>
<p>Quyết định của Ban tổ chức là quyết định cuối cùng.</p>`,

  doanhNghiep: `<h1>ĐIỀU LỆ BẦU CỬ HỘI ĐỒNG QUẢN TRỊ</h1>
<h2>I. CĂN CỨ PHÁP LÝ</h2>
<p>Căn cứ Luật Doanh nghiệp số 59/2020/QH14 được Quốc hội thông qua ngày 17/06/2020;</p>
<p>Căn cứ Điều lệ tổ chức và hoạt động của Công ty;</p>
<p>Căn cứ Nghị quyết Đại hội đồng cổ đông số [...] ngày [...];</p>

<h2>II. NGUYÊN TẮC BẦU CỬ</h2>
<p>Việc bầu cử Hội đồng quản trị được tiến hành theo nguyên tắc:</p>
<ul>
  <li>Công khai, dân chủ, đúng pháp luật</li>
  <li>Đảm bảo quyền lợi hợp pháp của tất cả cổ đông</li>
  <li>Tuân thủ đầy đủ các quy định của pháp luật, Điều lệ Công ty và Quy chế nội bộ về quản trị Công ty</li>
</ul>

<h2>III. ĐỐI TƯỢNG THỰC HIỆN BẦU CỬ</h2>
<p>Cổ đông sở hữu cổ phần có quyền biểu quyết và đại diện theo ủy quyền của cổ đông sở hữu cổ phần có quyền biểu quyết theo danh sách cổ đông tại ngày [...] có quyền tham gia bầu cử Hội đồng quản trị.</p>

<h2>IV. SỐ LƯỢNG, TIÊU CHUẨN THÀNH VIÊN HỘI ĐỒNG QUẢN TRỊ</h2>
<h3>4.1. Số lượng thành viên HĐQT</h3>
<p>Số lượng thành viên Hội đồng quản trị được bầu là [...] người.</p>

<h3>4.2. Tiêu chuẩn ứng cử viên</h3>
<p>Ứng cử viên Hội đồng quản trị phải đáp ứng các tiêu chuẩn sau:</p>
<ul>
  <li>Có năng lực hành vi dân sự đầy đủ, không thuộc đối tượng không được quản lý doanh nghiệp theo quy định tại Luật Doanh nghiệp;</li>
  <li>Có trình độ chuyên môn, kinh nghiệm trong quản lý kinh doanh hoặc trong lĩnh vực, ngành, nghề kinh doanh của Công ty;</li>
  <li>Không phải là người có quan hệ gia đình của Tổng Giám đốc và người quản lý khác của Công ty;</li>
  <li>Không đồng thời là thành viên Hội đồng quản trị tại quá 05 công ty khác;</li>
  <li>Các tiêu chuẩn khác theo quy định của pháp luật và Điều lệ Công ty.</li>
</ul>

<h2>V. PHƯƠNG THỨC BẦU CỬ</h2>
<h3>5.1. Phương thức bầu cử</h3>
<p>Việc bầu cử thành viên Hội đồng quản trị được thực hiện theo phương thức bầu dồn phiếu, theo đó mỗi cổ đông có tổng số phiếu biểu quyết tương ứng với tổng số cổ phần sở hữu nhân với số thành viên được bầu của Hội đồng quản trị. Cổ đông có quyền dồn hết tổng số phiếu bầu của mình cho một hoặc một số ứng cử viên.</p>

<h3>5.2. Phiếu bầu cử</h3>
<p>Mỗi cổ đông/đại diện theo ủy quyền của cổ đông sẽ được cấp một Phiếu bầu cử thành viên Hội đồng quản trị, trên đó có ghi:</p>
<ul>
  <li>Mã số cổ đông</li>
  <li>Số cổ phần sở hữu/đại diện</li>
  <li>Tổng số phiếu bầu</li>
  <li>Danh sách ứng cử viên</li>
</ul>

<h3>5.3. Cách thức bỏ phiếu</h3>
<p>Cổ đông thực hiện việc bầu cử bằng cách điền số phiếu bầu cho từng ứng cử viên mà mình lựa chọn, ký và ghi rõ họ tên vào Phiếu bầu cử.</p>

<h2>VI. BAN KIỂM PHIẾU VÀ NGUYÊN TẮC KIỂM PHIẾU</h2>
<h3>6.1. Ban Kiểm phiếu</h3>
<p>Ban Kiểm phiếu do Chủ tọa đề cử và được Đại hội đồng cổ đông thông qua. Ban Kiểm phiếu có trách nhiệm:</p>
<ul>
  <li>Hướng dẫn cách thức bầu cử</li>
  <li>Tiến hành kiểm phiếu</li>
  <li>Công bố kết quả bầu cử</li>
</ul>

<h3>6.2. Nguyên tắc kiểm phiếu</h3>
<p>Ban Kiểm phiếu tiến hành kiểm phiếu theo các nguyên tắc sau:</p>
<ul>
  <li>Ban Kiểm phiếu làm việc trung thực, chính xác, công khai, khách quan;</li>
  <li>Ban Kiểm phiếu có thể sử dụng phương tiện kỹ thuật và chuyên viên kỹ thuật hỗ trợ trong việc kiểm phiếu;</li>
  <li>Kiểm tra tính hợp lệ của Phiếu bầu cử;</li>
  <li>Kiểm tra lần lượt từng Phiếu bầu cử và ghi nhận kết quả kiểm phiếu;</li>
  <li>Niêm phong toàn bộ Phiếu bầu cử, bàn giao lại cho Chủ tọa.</li>
</ul>

<h2>VII. NGUYÊN TẮC TRÚNG CỬ</h2>
<p>Người trúng cử thành viên Hội đồng quản trị được xác định theo số phiếu bầu tính từ cao xuống thấp, bắt đầu từ ứng cử viên có số phiếu bầu cao nhất cho đến khi đủ số thành viên quy định.</p>
<p>Trường hợp có từ hai ứng cử viên trở lên đạt cùng số phiếu bầu như nhau cho thành viên cuối cùng của Hội đồng quản trị thì sẽ tiến hành bầu lại trong số các ứng cử viên có số phiếu bầu ngang nhau.</p>

<h2>VIII. HIỆU LỰC THI HÀNH</h2>
<p>Điều lệ bầu cử này có hiệu lực ngay sau khi được Đại hội đồng cổ đông thông qua và chỉ áp dụng cho việc bầu cử Hội đồng quản trị tại cuộc họp Đại hội đồng cổ đông [...] ngày [...].</p>`,
};
