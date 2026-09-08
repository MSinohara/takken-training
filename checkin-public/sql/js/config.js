const productionHosts = new Set([
  "tokyo-takken-10block.web.app",
  "tokyo-takken-10block.firebaseapp.com",
  "takken10b-checkin.web.app",
  "takken10b-checkin.firebaseapp.com",
]);

export const firebaseConfig = productionHosts.has(location.hostname)
  ? {
      apiKey: "AIzaSyDm12BPebCSrN7_OgnzBpW5-X69SR5hm8M",
      authDomain: "tokyo-takken-10block.firebaseapp.com",
      appId: "1:342810048041:web:08474ff6dbf7f9579fce38",
      projectId: "tokyo-takken-10block"
    }
  : {
      apiKey: "AIzaSyBU3aX5p9NibZpExGWaQ6mF1ehQB3BY-gE",
      authDomain: "takken-training-demo.web.app",
      appId: "1:104937796187:web:a3e51471f1f456fa40857e",
      projectId: "takken-training-demo"
    };
