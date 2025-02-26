/**
 * 此配置文件用于提供给 Trystero 的 joinRoom 函数，配置 RTC 连接。
 *
 * 该配置：
 * - 增加了 Google 的免费 STUN 服务器，用于直接获取公共IP信息，尽可能建立直接连接。
 * - 配置了多个 TURN 服务器，当穿透直连失败时可作为中继服务器。
 * - 设置了 iceCandidatePoolSize，提前生成 ICE 候选，加快连接建立速度。
 * - 使用 bundlePolicy 为 balanced，平衡带宽与连接稳定性。
 */
export const rtcConfig: RTCConfiguration = {
  iceServers: [
    // 免费的 STUN 服务器，用于获取 NAT 外部地址
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    // 第一个 TURN 服务器
    {
      urls: [
        'turn:23.95.61.186:3478?transport=udp',
        'turn:23.95.61.186:3478?transport=tcp'
      ],
      username: 'h3Z7TPYyGFRkeA1',
      credential: 'Pumhav-mamhyb-jufsa1'
    },
    // 第二个 TURN 服务器
    {
      urls: [
        'turn:206.189.39.100:3478?transport=udp',
        'turn:206.189.39.100:3478?transport=tcp'
      ],
      username: 'h3Z7TPYyGFRkeA1',
      credential: 'Pumhav-mamhyb-jufsa1'
    },
    // 备份 TURN 服务器
    {
      urls: 'turn:relay1.expressturn.com:3478',
      username: 'efQUQ79N77B5BNVVKF',
      credential: 'N4EAugpjMzPLrxSS',
    },
  ],
  // 预生成ICE候选数量，帮助加快连接建立速度
  iceCandidatePoolSize: 10,
  
  // 媒体混合策略，平衡带宽使用和连接稳定性
  bundlePolicy: 'balanced'
};
