import React, { useState } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import './QrForm.css';
import bankList from './banklist.js';


const BASIC_AUTH = 'Basic Y3VzdG9tZXItdmlldHFydGVzdC11c2VyMjQ2ODpZM1Z6ZEc5dFpYSXRkbWxsZEhGeWRHVnpkQzExYzJWeU1qUTJPQT09';
const TOKEN_URL = 'https://api.vietqr.org/vqr/api/token_generate';
const GENERATE_URL = 'https://api.vietqr.org/vqr/api/qr/generate-customer';

function sanitizeInput(str) {
    if (typeof str !== 'string') {
        return '';
    }
    str = str.replace(/Đ/g, 'D').replace(/đ/g, 'd');
    str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, '');
    str = str.replace(/[^a-zA-Z0-9 ]/g, ' ');
    str = str.replace(/\s+/g, ' ').trim();
    return str.toUpperCase();
}

function formatCurrency(amount) {
    const value = Number(amount) || 0;
    const formatted = new Intl.NumberFormat('vi-VN').format(value);
    return formatted + ' VNĐ';
}

function convertNumberToWords(num) {
    const so = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const chuSo = ['', ' nghìn', ' triệu', ' tỷ', ' nghìn tỷ', ' triệu tỷ'];

    const n = parseInt(num, 10);
    if (isNaN(n) || n < 0) return '';
    if (n === 0) return 'Không đồng';

    function doc3So(block) {
        const tram = Math.floor(block / 100);
        const chuc = Math.floor((block % 100) / 10);
        const donvi = block % 10;
        let s = '';

        if (tram !== 0) {
            s += so[tram] + ' trăm';
            if (chuc === 0 && donvi !== 0) s += ' lẻ';
        }

        if (chuc !== 0 && chuc !== 1) {
            s += ' ' + so[chuc] + ' mươi';
            if (donvi === 5) s += ' lăm';
            else if (donvi === 1) s += ' mốt';
            else if (donvi !== 0) s += ' ' + so[donvi];
        } else if (chuc === 1) {
            s += ' mười';
            if (donvi === 5) s += ' lăm';
            else if (donvi !== 0) s += ' ' + so[donvi];
        } else if (donvi !== 0 && tram !== 0) {
            s += ' ' + so[donvi];
        } else if (donvi !== 0 && tram === 0) {
            s += ' ' + so[donvi];
        }

        return s.trim();
    }

    let blocks = [];
    let temp = n;
    while (temp > 0) {
        blocks.push(temp % 1000);
        temp = Math.floor(temp / 1000);
    }

    let str = '';
    for (let i = 0; i < blocks.length; i++) {
        if (blocks[i] !== 0) {
            str = doc3So(blocks[i]) + chuSo[i] + ' ' + str;
        }
    }
    str = str.trim() + ' đồng';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => alert('Đã copy!'))
        .catch(() => alert('Không thể copy'));
}

function QrForm() {
    const [bankCode, setBankCode] = useState('');
    const [bankName, setBankName] = useState('');
    const [bankAccount, setbankAccount] = useState('');
    const [originalUserBankName, setOriginalUserBankName] = useState('');
    const [amount, setAmount] = useState('');
    const [originalContent, setOriginalContent] = useState('');
    const [qrCode, setQrCode] = useState('');

    const [showBankSearch, setShowBankSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredBanks = bankList.filter(
        (bank) =>
            bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bank.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectBank = (bank) => {
        setBankCode(bank.code);
        setBankName(bank.name);
        setShowBankSearch(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const sanitizedUserBankName = sanitizeInput(originalUserBankName);
        const sanitizedContent = sanitizeInput(originalContent);

        try {
            const tokenRes = await axios.post(
                TOKEN_URL,
                {},
                {
                    headers: {
                        Authorization: BASIC_AUTH,
                    },
                }
            );
            const accessToken = tokenRes.data.access_token;

            const qrRes = await axios.post(
                GENERATE_URL,
                {
                    amount,
                    content: sanitizedContent,
                    bankAccount,
                    bankCode,
                    userBankName: sanitizedUserBankName,
                    transType: 'C',
                    orderId: 'myOrderId123',
                    sign: '',
                    qrType: '0',
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            setQrCode(qrRes.data.qrCode);
        } catch (error) {
           console.error('Lỗi:', error.response?.data || error.message);
            if (error.response) {
                alert(`Lỗi từ VietQR API: ${error.response.status} - ${error.response.data.message || 'Không thể tạo QR'}`);
            } else if (error.request) {
                alert('Không thể kết nối đến VietQR API. Vui lòng kiểm tra kết nối mạng.');
            } else {
                alert('Đã xảy ra lỗi: ' + error.message);
            }
        }
    };

    return (
        <div className="qr-main-container">
            <div className="qr-form-container">
                <h2>Thông tin tạo mã</h2>
                <form onSubmit={handleSubmit}>
                    <div className="qr-form-group">
                        <label>Ngân hàng</label>
                        <div className="bank-search-wrapper">
                            <input
                                type="text"
                                placeholder="Chọn ngân hàng"
                                value={bankName}
                                readOnly
                                onClick={() => {
                                    setShowBankSearch(true);
                                    setSearchTerm('');
                                }}
                            />
                            <button
                                type="button"
                                className="submit-btn"
                                onClick={() => {
                                    setShowBankSearch(true);
                                    setSearchTerm('');
                                }}
                            >
                                Tìm ngân hàng
                            </button>
                        </div>
                    </div>

                    <div className="qr-form-group">
                        <label>Số tài khoản</label>
                        <input
                            type="text"
                            placeholder="Nhập số tài khoản"
                            value={bankAccount}
                            onChange={(e) => setbankAccount(sanitizeInput(e.target.value))}
                            required
                        />
                    </div>

                    <div className="qr-form-group">
                        <label>Tên chủ tài khoản</label>
                        <input
                            type="text"
                            placeholder="Nhập tên chủ tài khoản"
                            value={originalUserBankName}
                            onChange={(e) => setOriginalUserBankName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="qr-form-group">
                        <label>Số tiền</label>
                        <input
                            type="text"
                            placeholder="Nhập số tiền"
                            value={amount}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (/^[0-9]*$/.test(value)) {
                                    setAmount(value);
                                }
                            }}
                            required
                        />
                    </div>

                    <div className="qr-form-group">
                        <label>Nội dung thanh toán</label>
                        <input
                            type="text"
                            placeholder="Nội dung (không bắt buộc)"
                            value={originalContent}
                            onChange={(e) => setOriginalContent(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="submit-btn">
                        Tạo mã VietQR
                    </button>
                </form>
            </div>

            <div className="qr-display-container">
                <h2>Mã QR VNEDU</h2>

                {qrCode ? (
                    <div className="qr-frame-container">
                        <img
                            src="images/qr-kit-vnedu.png"
                            alt="Khung VietQR"
                            className="qr-frame"
                        />
                        <div className="qr-code-overlay">
                        <QRCodeCanvas
                            value={qrCode}
                            size={135}
                            level="H"
                            fgColor="#593222"
                            bgColor="#FFFFFF"
                        />
                        </div>
                        <p className="qr-content">
                            Nội dung: {originalContent}
                            <button
                                className="copy-btn"
                                onClick={() => copyToClipboard(originalContent || '')}
                            >
                                Copy
                            </button>
                        </p>
                        <p className="qr-amount">
                            Số tiền: {formatCurrency(amount)}
                            <button
                                className="copy-btn"
                                onClick={() => copyToClipboard(formatCurrency(amount))}
                            >
                                Copy
                            </button>
                        </p>
                        <p className="qr-amount-words">
                            Bằng chữ: {convertNumberToWords(amount)}
                            <button
                                className="copy-btn"
                                onClick={() => copyToClipboard(convertNumberToWords(amount))}
                            >
                                Copy
                            </button>
                        </p>
                    </div>
                ) : (
                    <div className="qr-frame-container">
                        <img
                            src="images/qr-kit-vnedu.png"
                            alt="Khung VietQR"
                            className="qr-frame"
                        />
                        <div className="qr-code-overlay">
                        <QRCodeCanvas
                            value="https://vietqr.online"
                            size={135}
                            level="H"
                            fgColor="#593222"
                            bgColor="#FFFFFF"
                            />
                        </div>
                        <p className="qr-string">Chưa có mã QR nào được tạo</p>
                    </div>
                )}
            </div>
            <div className="qr-display-container">
                <h2>Mã QR EVN</h2>

                {qrCode ? (
                    <div className="qr-frame-container">
                        <img
                            src="images/evn-kit-payment.png"
                            alt="Khung VietQR"
                            className="qr-frame"
                        />
                        <div className="qr-code-overlay-evn">
                        <QRCodeCanvas
                            value={qrCode}
                            size={180}
                            level="H"
                            fgColor="#3300FF"
                            bgColor="#FFFFFF"
                        />
                        </div>
                        <p className="qr-content">
                            Nội dung: {originalContent}
                            <button
                                className="copy-btn"
                                onClick={() => copyToClipboard(originalContent || '')}
                            >
                                Copy
                            </button>
                        </p>
                        <p className="qr-amount">
                            Số tiền: {formatCurrency(amount)}
                            <button
                                className="copy-btn"
                                onClick={() => copyToClipboard(formatCurrency(amount))}
                            >
                                Copy
                            </button>
                        </p>
                        <p className="qr-amount-words">
                            Bằng chữ: {convertNumberToWords(amount)}
                            <button
                                className="copy-btn"
                                onClick={() => copyToClipboard(convertNumberToWords(amount))}
                            >
                                Copy
                            </button>
                        </p>
                    </div>
                ) : (
                    <div className="qr-frame-container">
                        <img
                            src="images/evn-kit-payment.png"
                            alt="Khung VietQR"
                            className="qr-frame"
                        />
                        <div className="qr-code-overlay-evn">
                        <QRCodeCanvas
                            value="https://vietqr.online"
                            size={180}
                            level="H"
                            fgColor="#3300FF"
                            bgColor="#FFFFFF"
                            />
                        </div>
                        <p className="qr-string">Chưa có mã QR nào được tạo</p>
                    </div>
                )}
            </div>
            {showBankSearch && (
                <div className="bank-search-overlay">
                <div className="bank-search-box">
                    <div className="bank-search-header">
                    <h3>Tìm ngân hàng</h3>
                    <button
                        className="close-button"
                        onClick={() => setShowBankSearch(false)}
                    >
                        Đóng
                    </button>
                    </div>
                    <div className="bank-search-input">
                    <input
                        type="text"
                        placeholder="Nhập tên hoặc mã ngân hàng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    </div>
                    <div className="bank-list-container">
                    <ul className="bank-list">
                        {filteredBanks.map((bank) => (
                        <li key={bank.code} onClick={() => handleSelectBank(bank)}>
                            <strong>{bank.code}</strong> - {bank.name}
                        </li>
                        ))}
                        {filteredBanks.length === 0 && (
                        <li style={{ color: '#999' }}>Không tìm thấy ngân hàng</li>
                        )}
                    </ul>
                    </div>
                </div>
                </div>
            )}

        </div>
    );
}

export default QrForm;