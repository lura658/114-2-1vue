// QRcode生成工具 - 使用 qrcode.react 或者基于URL编码
export const qrcodeUtils = {
  // 生成QRcode URL（使用免费的QR服务）
  generateQRCode(text, size = 200) {
    // 使用 goQR.me API
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
  },

  // 生成测验链接
  generateQuizLink(quizId, quizName) {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
      mode: 'quiz',
      quizId: quizId,
      quizName: quizName
    });
    return `${baseUrl}?${params.toString()}`;
  },

  // 生成投票链接
  generateVoteLink(voteId, voteName) {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
      mode: 'vote',
      voteId: voteId,
      voteName: voteName
    });
    return `${baseUrl}?${params.toString()}`;
  },

  // 从URL参数获取模式
  getModeFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') || null;
  },

  // 从URL参数获取ID
  getIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('quizId') || params.get('voteId') || null;
  },

  // 从URL参数获取名称
  getNameFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('quizName') || params.get('voteName') || null;
  }
};
