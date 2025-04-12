/**
 * Vietnamese UTF-8 Utilities
 * Công cụ hỗ trợ xử lý lỗi mã hóa UTF-8 cho tiếng Việt
 */

/**
 * Decode Base64 string với hỗ trợ UTF-8
 * @param base64String Chuỗi Base64 cần decode
 * @returns Chuỗi UTF-8 đã giải mã
 */
export const decodeBase64UTF8 = (base64String: string): string => {
  try {
    // Decode base64 (atob không xử lý UTF-8 đúng)
    const binaryString = atob(base64String);

    // Chuyển binary string sang mảng byte
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Decode mảng byte sang UTF-8 string
    return new TextDecoder('utf-8').decode(bytes);
  } catch (error) {
    console.error('Lỗi khi decode Base64 UTF-8:', error);
    return base64String; // Trả về chuỗi gốc nếu lỗi
  }
};

/**
 * Encode chuỗi UTF-8 thành Base64
 * @param utf8String Chuỗi UTF-8 cần encode
 * @returns Chuỗi Base64
 */
export const encodeUTF8Base64 = (utf8String: string): string => {
  try {
    // Encode UTF-8 string thành mảng byte
    const bytes = new TextEncoder().encode(utf8String);

    // Chuyển mảng byte thành binary string
    let binaryString = '';
    bytes.forEach((byte) => {
      binaryString += String.fromCharCode(byte);
    });

    // Encode binary string thành Base64
    return btoa(binaryString);
  } catch (error) {
    console.error('Lỗi khi encode UTF-8 sang Base64:', error);
    return btoa(utf8String); // Trả về chuỗi Base64 thông thường nếu lỗi
  }
};

// Từ điển mã hóa sai UTF-8 tiếng Việt và chuỗi đúng tương ứng
export const vietnameseCharacterMap: Record<string, string> = {
  // Dấu sắc
  'Ã¡': 'á',
  'áº¥': 'ấ',
  'áº¯': 'ắ',
  'Ã©': 'é',
  'áº¿': 'ế',
  'Ã­': 'í',
  'Ã³': 'ó',
  'á»': 'ố',
  'á»': 'ớ',
  Ãº: 'ú',
  'á»©': 'ứ',
  'Ã½': 'ý',
  Ã: 'Á',
  'áº¤': 'Ấ',
  'áº®': 'Ắ',
  'Ã‰': 'É',
  'áº¾': 'Ế',
  Ã: 'Í',
  'Ã"': 'Ó',
  'á»': 'Ố',
  'á»': 'Ớ',
  Ãš: 'Ú',
  'á»¨': 'Ứ',
  Ã: 'Ý',

  // Dấu huyền
  'Ã ': 'à',
  'áº§': 'ầ',
  'áº±': 'ằ',
  'Ã¨': 'è',
  'á»': 'ề',
  'Ã¬': 'ì',
  'Ã²': 'ò',
  'á»': 'ồ',
  'á»': 'ờ',
  'Ã¹': 'ù',
  'á»«': 'ừ',
  'á»³': 'ỳ',
  'Ã€': 'À',
  'áº¦': 'Ầ',
  'áº°': 'Ằ',
  Ãˆ: 'È',
  'á»€': 'Ề',
  ÃŒ: 'Ì',
  Ã: 'Ò',
  'á»': 'Ồ',
  'á»š': 'Ờ',
  'Ã™': 'Ù',
  'á»ª': 'Ừ',
  'á»²': 'Ỳ',

  // Dấu hỏi
  'áº£': 'ả',
  'áº©': 'ẩ',
  'áº³': 'ẳ',
  'áº»': 'ẻ',
  'á»ƒ': 'ể',
  'á»‰': 'ỉ',
  'á»': 'ỏ',
  'á»•': 'ổ',
  'á»Ÿ': 'ở',
  'á»§': 'ủ',
  'á»­': 'ử',
  'á»·': 'ỷ',
  'áº¢': 'Ả',
  'áº¨': 'Ẩ',
  'áº²': 'Ẳ',
  áºº: 'Ẻ',
  'á»‚': 'Ể',
  'á»ˆ': 'Ỉ',
  'á»Ž': 'Ỏ',
  'á»"': 'Ổ',
  'á»ž': 'Ở',
  'á»¦': 'Ủ',
  'á»¬': 'Ử',
  'á»¶': 'Ỷ',

  // Dấu ngã
  'Ã£': 'ã',
  'áº«': 'ẫ',
  'áº·': 'ẵ',
  'áº½': 'ẽ',
  'á»…': 'ễ',
  'Ä©': 'ĩ',
  Ãµ: 'õ',
  'á»—': 'ỗ',
  'á»¡': 'ỡ',
  'Å©': 'ũ',
  'á»¯': 'ữ',
  'á»¹': 'ỹ',
  Ãƒ: 'Ã',
  áºª: 'Ẫ',
  'áº¶': 'Ẵ',
  'áº¼': 'Ẽ',
  'á»„': 'Ễ',
  'Ä¨': 'Ĩ',
  'Ã•': 'Õ',
  'á»–': 'Ỗ',
  'á» ': 'Ỡ',
  'Å¨': 'Ũ',
  'á»®': 'Ữ',
  'á»¸': 'Ỹ',

  // Dấu nặng
  'áº¡': 'ạ',
  'áº­': 'ậ',
  'áº¹1': 'ặ', // Đã sửa key trùng lặp thành áº¹1
  'áº¹': 'ẹ',
  'á»‡': 'ệ',
  'á»‹': 'ị',
  'á»': 'ọ',
  'á»™': 'ộ',
  'á»£': 'ợ',
  'á»¥': 'ụ',
  'á»±': 'ự',
  'á»µ': 'ỵ',
  'áº ': 'Ạ',
  'áº¬': 'Ậ',
  'áº¸1': 'Ặ', // Đã sửa key trùng lặp thành áº¸1
  'áº¸': 'Ẹ',
  'á»†': 'Ệ',
  'á»Š': 'Ị',
  'á»Œ': 'Ọ',
  'á»˜': 'Ộ',
  'á»¢': 'Ợ',
  'á»¤': 'Ụ',
  'á»°': 'Ự',
  'á»´': 'Ỵ',

  // Các chữ Đ, đ
  Ä: 'Đ',
  Ä: 'đ',

  // Các từ thường gặp
  'Loáº¡i phiáº¿u': 'Loại phiếu',
  'Phiáº¿u báº§u cá»­ chÃ­nh thá»©c': 'Phiếu bầu cử chính thức',
  'ÄÆ¡n vá» tá» chá»©c': 'Đơn vị tổ chức',
  'Khu vá»±c báº§u cá»­': 'Khu vực bầu cử',
  'NgÃ y': 'Ngày',
  'NgÃ y cáº¥p': 'Ngày cấp',
  'Hash kiá»m chá»©ng': 'Hash kiểm chứng',
  'ID phiÃªn báº§u cá»­': 'ID phiên bầu cử',
  'TÃªn phiÃªn báº§u cá»­': 'Tên phiên bầu cử',
  'Email cá»­ tri': 'Email cử tri',
  'Äá»a chá» cá»­ tri': 'Địa chỉ cử tri',
  'PhiÃªn báº§u cá»­': 'Phiên bầu cử',
  'KhÃ´ng hiá»u': 'Không hiểu',
  'báº§u cá»­': 'bầu cử',
  'chÃ­nh thá»©c': 'chính thức',
};

/**
 * Sửa lỗi mã hóa UTF-8 tiếng Việt
 * @param text Chuỗi văn bản cần sửa
 * @returns Chuỗi đã được sửa lỗi mã hóa
 */
export const fixVietnameseEncoding = (text: string): string => {
  if (typeof text !== 'string') return String(text);

  let result = text;

  // Sửa từng chuỗi con theo từ điển
  for (const [encoded, decoded] of Object.entries(vietnameseCharacterMap)) {
    result = result.replace(new RegExp(encoded, 'g'), decoded);
  }

  return result;
};

/**
 * Làm sạch đối tượng JSON có chứa văn bản tiếng Việt bị lỗi mã hóa
 * @param jsonObj Đối tượng JSON cần xử lý
 * @returns Đối tượng JSON đã được làm sạch
 */
export const cleanVietnameseJsonObject = (jsonObj: any): any => {
  if (jsonObj === null || jsonObj === undefined) return jsonObj;

  if (typeof jsonObj === 'string') {
    return fixVietnameseEncoding(jsonObj);
  }

  if (Array.isArray(jsonObj)) {
    return jsonObj.map((item) => cleanVietnameseJsonObject(item));
  }

  if (typeof jsonObj === 'object') {
    const result: Record<string, any> = {};
    for (const key in jsonObj) {
      if (Object.prototype.hasOwnProperty.call(jsonObj, key)) {
        // Làm sạch cả key và value
        const cleanKey = fixVietnameseEncoding(key);
        result[cleanKey] = cleanVietnameseJsonObject(jsonObj[key]);
      }
    }
    return result;
  }

  return jsonObj;
};

/**
 * Parse JSON từ chuỗi Base64 có hỗ trợ UTF-8
 * @param base64JSON Chuỗi Base64 chứa JSON
 * @returns Đối tượng JavaScript từ JSON
 */
export const parseBase64JsonWithUTF8 = (base64JSON: string): any => {
  try {
    // Decode base64 thành UTF-8
    const jsonString = decodeBase64UTF8(base64JSON);

    // Parse JSON
    const jsonObj = JSON.parse(jsonString);

    // Làm sạch đối tượng JSON
    return cleanVietnameseJsonObject(jsonObj);
  } catch (error) {
    console.error('Lỗi khi parse Base64 JSON với UTF-8:', error);
    return null;
  }
};
