function startLongTextJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const token =
    Utilities.getUuid();

  CacheService
    .getScriptCache()
    .put(
      "LONG_TEXT_" + token,
      "",
      600
    );

  const result = {
    ok: true,
    token: token
  };

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}


function appendLongTextChunkJsonp_(e) {

  const callback =
    e.parameter.callback || "callback";

  const token =
    String(e.parameter.token || "").trim();

  const chunk =
    String(e.parameter.chunk || "");

  let result;

  try {

    if (!token) {
      throw new Error("長文保存用のキーがありません。");
    }

    const cache =
      CacheService.getScriptCache();

    const key =
      "LONG_TEXT_" + token;

    const current =
      cache.get(key) || "";

    cache.put(
      key,
      current + chunk,
      600
    );

    result = {
      ok: true
    };

  } catch (err) {

    result = {
      ok: false,
      message: err.message
    };
  }

  return ContentService
    .createTextOutput(
      callback + "(" + JSON.stringify(result) + ")"
    )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}


function getLongTextByToken_(token) {

  if (!token) {
    return "";
  }

  return CacheService
    .getScriptCache()
    .get(
      "LONG_TEXT_" + token
    ) || "";
}