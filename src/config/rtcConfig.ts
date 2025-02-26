// This object is provided as `config.rtcConfig` to Trystero's `joinRoom`
// function: https://github.com/dmotz/trystero#joinroomconfig-namespace
//
// https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/RTCPeerConnection#parameters
export const rtcConfig: RTCConfiguration = {
  // These are the relay servers that are used in case a direct peer-to-peer
  // connection cannot be made.
  iceServers: [
    // 您的第一个TURN服务器
    {
      urls: [
        'turn:23.95.61.186:3478?transport=udp',
        'turn:23.95.61.186:3478?transport=tcp'
      ],
      username: 'h3Z7TPYyGFRkeA1',
      credential: 'Pumhav-mamhyb-jufsa1'
    },
    // 您的第二个TURN服务器
    {
      urls: [
        'turn:206.189.39.100:3478?transport=udp',
        'turn:206.189.39.100:3478?transport=tcp'
      ],
      username: 'h3Z7TPYyGFRkeA1',
      credential: 'Pumhav-mamhyb-jufsa1'
    },
    // 您也可以保留原有的服务器作为额外备份
    {
      urls: 'turn:relay1.expressturn.com:3478',
      username: 'efQUQ79N77B5BNVVKF',
      credential: 'N4EAugpjMzPLrxSS',
    },
  ],
  
  // 可选的高级配置
  iceCandidatePoolSize: 10, // 预生成的ICE候选数量，提高连接速度
  bundlePolicy: 'balanced'  // 媒体包策略
}
