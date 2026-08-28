export const CHECKIN_METHODS = Object.freeze({
  WEB_SEARCH: "会場QR＋WEB検索",
  DIRECT_QR: "会社・個人QR受付",
  PRE_REGISTERED: "スマホ事前登録＋会場QR受付",
  STAFF: "係員受付",
  LOAD_TEST: "負荷試験",
});

const LEGACY_LABELS = Object.freeze({
  SQL_WEB: CHECKIN_METHODS.WEB_SEARCH,
  SQL_QR: CHECKIN_METHODS.DIRECT_QR,
  SQL_QR_READER: CHECKIN_METHODS.DIRECT_QR,
  SQL_QR_CAMERA: CHECKIN_METHODS.DIRECT_QR,
  SQL_LOAD_WEB: CHECKIN_METHODS.LOAD_TEST,
});

export function checkinMethodLabel(value) {
  const method = String(value || "");
  return LEGACY_LABELS[method] || method;
}
